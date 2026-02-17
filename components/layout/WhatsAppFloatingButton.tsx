'use client'

type Props = {
  phone: string
  text?: string
}

function normalizeWaDigits(phone: string) {
  return String(phone || '').replace(/[^\d]/g, '')
}

export default function WhatsAppFloatingButton({ phone, text }: Props) {
  const digits = normalizeWaDigits(phone)
  if (!digits) return null

  const message = (text || '').trim() || 'Hola COP, quiero hacer una consulta.'
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir WhatsApp de COP"
      title="WhatsApp"
      className="fixed bottom-5 right-5 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 ring-1 ring-white/30 transition hover:scale-105 hover:shadow-2xl active:scale-95"
    >
      {/* WhatsApp logo (SVG) */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M19.11 17.43c-.28-.14-1.64-.81-1.89-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.09-.16.18-.32.21-.6.07-.28-.14-1.16-.43-2.21-1.38-.82-.73-1.38-1.64-1.54-1.91-.16-.28-.02-.43.12-.57.12-.12.28-.32.41-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47l-.52-.01c-.18 0-.49.07-.74.35-.25.28-.98.96-.98 2.35 0 1.38 1 2.72 1.14 2.91.14.18 1.97 3.01 4.78 4.23.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.64-.67 1.87-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32Z"
        />
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M16 3C9.37 3 4 8.28 4 14.8c0 2.14.58 4.22 1.69 6.05L4 29l8.35-1.6a12.2 12.2 0 0 0 3.65.55c6.63 0 12-5.28 12-11.8S22.63 3 16 3Zm0 22.1c-1.17 0-2.33-.2-3.43-.6l-.98-.36-4.95.95.95-4.73-.42-1.01A10.08 10.08 0 0 1 6 14.8C6 9.4 10.48 5 16 5s10 4.4 10 9.8-4.48 10.3-10 10.3Z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  )
}

