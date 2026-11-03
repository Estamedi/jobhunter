import { useEffect, useRef } from 'react'
import {
  HttpTransportType,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'
import { getAccessToken } from '@/lib/http'
import { type CvDraftStatus } from '../api'

interface CvDraftChanged {
  draftId: number
  status: CvDraftStatus
}

const HUB_PATH = '/hubs/cv-generation'

// Live updates: the server says a draft changed and the page then reads it again. This only speeds things
// up. The page also polls while a draft is being written, so it still works if the hub cannot connect.
export function useCvGenerationHub(onChanged: (event: CvDraftChanged) => void) {
  const handler = useRef(onChanged)
  useEffect(() => {
    handler.current = onChanged
  })

  useEffect(() => {
    const base = (import.meta.env.VITE_API_BASE_URL ?? '') as string
    const connection = new HubConnectionBuilder()
      .withUrl(`${base}${HUB_PATH}`, {
        accessTokenFactory: getAccessToken,
        // The API allows any origin, which cannot be combined with credentials. Server-sent events are
        // left out because a proxy buffers them; long polling is the fallback behind a plain proxy.
        withCredentials: false,
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()

    connection.on('CvDraftChanged', (event: CvDraftChanged) =>
      handler.current(event)
    )

    // No live connection is fine: polling keeps the page up to date.
    connection.start().catch(() => undefined)

    return () => {
      void connection.stop()
    }
  }, [])
}
