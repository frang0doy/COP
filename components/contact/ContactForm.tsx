'use client'

import { useState } from 'react'
import { Send, Mail, User, Phone, FileText, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje')
      }

      toast.success('Mensaje enviado correctamente. Te contactaremos pronto.')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error) {
      toast.error('Error al enviar el mensaje. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-3 md:mb-4">
          Envíanos un Mensaje
        </h2>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
          Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo a la brevedad.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 md:p-8 lg:p-12">
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {/* Nombre */}
            <div className="group">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Nombre Completo</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-all bg-white placeholder-gray-400"
                placeholder="Tu nombre completo"
              />
            </div>

            {/* Email */}
            <div className="group">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>Email</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-all bg-white placeholder-gray-400"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {/* Teléfono */}
            <div className="group">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>Teléfono</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-all bg-white placeholder-gray-400"
                placeholder="351 590 0630"
              />
            </div>

            {/* Asunto */}
            <div className="group">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span>Asunto</span>
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-all bg-white placeholder-gray-400"
                placeholder="Asunto del mensaje"
              />
            </div>
          </div>

          {/* Mensaje */}
          <div className="group">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span>Mensaje</span>
            </label>
            <textarea
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 transition-all bg-white resize-none placeholder-gray-400"
              placeholder="Escribe tu mensaje aquí..."
            />
          </div>

          {/* Botón de envío */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className="w-full bg-orange-500 text-white py-3 md:py-4 px-6 border border-orange-500 font-semibold hover:bg-orange-600 hover:border-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-base md:text-lg group"
          >
            <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span>{isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}</span>
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}
