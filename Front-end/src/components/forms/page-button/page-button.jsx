import './page-button.css'

export default function PageButton({ 
  pagina, 
  pageCount, 
  onPageChange,
  className = ''
}) {
  const handleAnterior = () => {
    if (pagina > 1) {
      onPageChange(pagina - 1)
    }
  }
  
  const handleSiguiente = () => {
    if (pagina < pageCount) {
      onPageChange(pagina + 1)
    }
  }

  const totalPages = pageCount || 1
  const currentPage = pagina || 1

  return (
    <div className={`pagination ${className}`}>
      <button
        type="button"
        className="pagination-btn"
        onClick={handleAnterior}
        disabled={currentPage <= 1}
      >
        Anterior
      </button>
      <span>{currentPage}</span>
      <button
        type="button"
        className="pagination-btn"
        onClick={handleSiguiente}
        disabled={currentPage >= totalPages}
      >
        Siguiente
      </button>
    </div>
  )
}
