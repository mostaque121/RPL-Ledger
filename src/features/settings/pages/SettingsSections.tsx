import { QueryView } from '@/components/feedback/QueryView'
import { useInvoiceProfileQuery } from '@/features/invoices/api/profile'
import { coursesApi } from '../api/courses'
import { useFxRatesQuery } from '../api/fx-rates'
import { rtosApi } from '../api/rtos'
import { useSettingsQuery } from '../api/settings'
import { BackupPanel } from '../components/BackupPanel'
import { FxRatesManager, FxRatesSkeleton } from '../components/FxRatesManager'
import { InvoiceProfileForm, InvoiceProfileSkeleton } from '../components/InvoiceProfileForm'
import { COURSE_COPY, RTO_COPY } from '../components/name-lists'
import { NameListManager, NameListSkeleton } from '../components/NameListManager'
import { TaxSharesForm, TaxSharesSkeleton } from '../components/TaxSharesForm'

/** One page per setting, each rendered inside `SettingsLayout`. */

export function TaxSharesSettings() {
  const settings = useSettingsQuery()
  return (
    <QueryView query={settings} loading={<TaxSharesSkeleton />}>
      {(data) => <TaxSharesForm settings={data} />}
    </QueryView>
  )
}

export function FxRatesSettings() {
  const rates = useFxRatesQuery()
  return (
    <QueryView query={rates} loading={<FxRatesSkeleton />}>
      {(data) => <FxRatesManager rates={data} />}
    </QueryView>
  )
}

export function RtosSettings() {
  const rtos = rtosApi.useListQuery()
  return (
    <QueryView query={rtos} loading={<NameListSkeleton copy={RTO_COPY} />}>
      {(data) => <NameListManager api={rtosApi} items={data} copy={RTO_COPY} />}
    </QueryView>
  )
}

export function CoursesSettings() {
  const courses = coursesApi.useListQuery()
  return (
    <QueryView query={courses} loading={<NameListSkeleton copy={COURSE_COPY} />}>
      {(data) => <NameListManager api={coursesApi} items={data} copy={COURSE_COPY} />}
    </QueryView>
  )
}

export function InvoiceProfileSettings() {
  const profile = useInvoiceProfileQuery()
  return (
    <QueryView query={profile} loading={<InvoiceProfileSkeleton />}>
      {(data) => <InvoiceProfileForm profile={data} />}
    </QueryView>
  )
}

export function BackupSettings() {
  return <BackupPanel />
}
