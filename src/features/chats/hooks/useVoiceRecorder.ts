import { useCallback, useEffect, useRef, useState } from 'react'

/** Longest voice note; the composer sends it when the timer gets here. */
export const MAX_VOICE_SECONDS = 5 * 60

export interface VoiceNote {
  file: File
  durationSeconds: number
}

/** Pick a format this browser can record (Chrome/Firefox: webm/ogg, Safari: mp4). */
function supportedType() {
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((type) =>
    MediaRecorder.isTypeSupported(type),
  )
}

/**
 * Records a voice note with the microphone. `stop()` resolves with the recording;
 * `cancel()` throws it away.
 */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const startedAt = useRef(0)
  const finish = useRef<((note: VoiceNote | null) => void) | null>(null)

  const supported = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices

  const release = useCallback(() => {
    recorder.current?.stream.getTracks().forEach((track) => track.stop())
    recorder.current = null
    setRecording(false)
    setSeconds(0)
  }, [])

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const type = supportedType()
    const media = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    chunks.current = []
    media.ondataavailable = (event) => event.data.size > 0 && chunks.current.push(event.data)
    media.onstop = () => {
      const mimeType = (media.mimeType || type || 'audio/webm').split(';')[0]
      const extension = mimeType.split('/')[1] ?? 'webm'
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
      const blob = new Blob(chunks.current, { type: mimeType })
      finish.current?.(
        blob.size ? { file: new File([blob], `voice-note.${extension}`, { type: mimeType }), durationSeconds } : null,
      )
      finish.current = null
      release()
    }
    recorder.current = media
    startedAt.current = Date.now()
    media.start()
    setRecording(true)
  }, [release])

  const stop = useCallback(
    () =>
      new Promise<VoiceNote | null>((resolve) => {
        if (!recorder.current) return resolve(null)
        finish.current = resolve
        recorder.current.stop()
      }),
    [],
  )

  const cancel = useCallback(() => {
    finish.current = null
    if (recorder.current?.state === 'recording') recorder.current.stop()
    else release()
  }, [release])

  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 250)
    return () => clearInterval(timer)
  }, [recording])

  // Never leave the microphone on after leaving the chat.
  useEffect(() => () => cancel(), [cancel])

  return { supported, recording, seconds, start, stop, cancel }
}
