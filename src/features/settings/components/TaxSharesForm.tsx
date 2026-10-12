import { zodResolver } from '@hookform/resolvers/zod'
import { PercentIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { PercentInput } from '@/components/forms/PercentInput'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { useSaveSettingsMutation, type AppSettings } from '../api/settings'
import { settingsSchema, type SettingsValues } from '../schema'
import { Skeleton } from '@/components/ui/skeleton'
import { FieldSkeleton, SaveBar, SettingsHeader, SettingsRow } from './settings-ui'
import { ShareExample } from './ShareExample'

const HEADER = {
  icon: PercentIcon,
  title: 'Tax & partner shares',
  description: 'Used in every profit, statement and expense split.',
}

const ROWS = {
  tax: {
    title: 'Tax reserve',
    description: 'Taken off the profit of every sale, whoever made it, before anything is shared. Covers GST and income tax.',
  },
  shares: {
    title: 'Partner shares',
    description: "How employee-sale profit and shared expenses are split. MD gets whatever Tanvir doesn't.",
  },
  example: {
    title: 'Worked example',
    description: 'An employee sale with A$1,050 profit, using the numbers above. It updates as you type.',
  },
}

/** The page while the settings load: the same rows, the inputs waiting. */
export function TaxSharesSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading settings">
      <SettingsHeader {...HEADER} />
      <div>
        <SettingsRow {...ROWS.tax}>
          <FieldSkeleton label="Tax reserve %" className="max-w-40" />
        </SettingsRow>
        <SettingsRow {...ROWS.shares}>
          <div className="grid max-w-sm grid-cols-2 gap-4">
            <FieldSkeleton label="Tanvir %" />
            <FieldSkeleton label="MD %" />
          </div>
        </SettingsRow>
        <SettingsRow {...ROWS.example}>
          <Skeleton className="h-36 max-w-md rounded-lg" />
        </SettingsRow>
      </div>
      <SaveBar dirty={false} pending={false} onReset={() => {}} />
    </div>
  )
}

/** Tax % and the Tanvir / MD split. MD's share is always 100 − Tanvir's. */
export function TaxSharesForm({ settings }: { settings: AppSettings }) {
  const save = useSaveSettingsMutation()
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    values: { taxPct: settings.taxPct, tanvirShare: settings.tanvirShare },
  })
  const { errors, isDirty } = form.formState
  const [taxPct, tanvirShare] = useWatch({ control: form.control, name: ['taxPct', 'tanvirShare'] })
  const valid = settingsSchema.safeParse({ taxPct, tanvirShare }).success
  const mdShare = valid ? Math.round((100 - tanvirShare) * 100) / 100 : null

  return (
    <div className="space-y-2">
      <SettingsHeader {...HEADER} />

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        <div>
          <SettingsRow {...ROWS.tax}>
            <Field data-invalid={!!errors.taxPct} className="max-w-40">
              <FieldLabel htmlFor="taxPct">Tax reserve %</FieldLabel>
              <PercentInput id="taxPct" invalid={!!errors.taxPct} {...form.register('taxPct', { valueAsNumber: true })} />
              <FieldError errors={[errors.taxPct]} />
            </Field>
          </SettingsRow>

          <SettingsRow {...ROWS.shares}>
            <div className="grid max-w-sm grid-cols-2 gap-4">
              <Field data-invalid={!!errors.tanvirShare}>
                <FieldLabel htmlFor="tanvirShare">Tanvir %</FieldLabel>
                <PercentInput
                  id="tanvirShare"
                  invalid={!!errors.tanvirShare}
                  {...form.register('tanvirShare', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.tanvirShare]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="mdShare">MD %</FieldLabel>
                <PercentInput id="mdShare" value={mdShare ?? ''} readOnly tabIndex={-1} className="bg-muted" />
                <FieldDescription className="text-xs">Always 100 − Tanvir</FieldDescription>
              </Field>
            </div>
          </SettingsRow>

          <SettingsRow {...ROWS.example}>
            {valid ? (
              <ShareExample settings={{ taxPct, tanvirShare }} />
            ) : (
              <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                Fix the numbers above to see the example.
              </p>
            )}
          </SettingsRow>
        </div>

        <SaveBar dirty={isDirty} pending={save.isPending} onReset={() => form.reset()} />
      </form>
    </div>
  )
}
