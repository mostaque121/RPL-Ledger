import { ArrowLeftIcon, CompassIcon, HouseIcon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ErrorScreen } from './ErrorScreen'

/** Any address the app doesn't know. Shown inside the app frame, so the sidebar still works. */
export function NotFoundPage() {
  const { pathname, key } = useLocation()
  const navigate = useNavigate()
  useDocumentTitle('Page not found')

  return (
    <ErrorScreen
      icon={CompassIcon}
      title="Page not found"
      description={
        <>
          There's nothing at <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs break-all">{pathname}</code>. The
          link may be old, or the record was deleted.
        </>
      }
    >
      {key !== 'default' && (
        <Button variant="outline" onClick={() => void navigate(-1)}>
          <ArrowLeftIcon />
          Go back
        </Button>
      )}
      <Button asChild>
        <Link to="/">
          <HouseIcon />
          Dashboard
        </Link>
      </Button>
    </ErrorScreen>
  )
}
