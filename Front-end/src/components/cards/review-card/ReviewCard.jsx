import './review-card.css'

export default function ReviewCard({ resena }) {
  // Soporta tanto datos normalizados como datos de Strapi
  const resenaAttrs = resena?.attributes ?? resena
  const usuario = resenaAttrs?.users_permissions_user?.data ?? resenaAttrs?.users_permissions_user
  const usuarioAttrs = usuario?.attributes ?? usuario ?? usuario
  const nombreUsuario = usuarioAttrs?.username ?? usuarioAttrs?.email ?? usuario?.username ?? usuario?.email ?? 'Usuario'
  const valoracion = Number(resenaAttrs?.valoracion ?? resena?.valoracion ?? 0)
  const comentario = resenaAttrs?.comentario ?? resena?.comentario ?? ''

  const renderEstrellas = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < valoracion ? 'estrella llena' : 'estrella vacia'}>
        ★
      </span>
    ))
  }

  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-card-stars">{renderEstrellas()}</div>
        <div className="review-card-name">{nombreUsuario}</div>
      </div>
      {comentario && (
        <div className="review-card-comment">{comentario}</div>
      )}
    </div>
  )
}
