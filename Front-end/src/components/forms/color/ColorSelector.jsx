import { COLOR_HEX_MAP } from '../../../utils/colorMap.js'
import './ColorSelector.css'

export default function ColorSelector({ 
  colores, 
  selectedColors = [], 
  onColorToggle, 
  multiple = false 
}) {
  const handleColorClick = (colorValor) => {
    if (onColorToggle) {
      if (multiple) {
        if (selectedColors.includes(colorValor)) {
          onColorToggle(selectedColors.filter(c => c !== colorValor))
        } else {
          onColorToggle([...selectedColors, colorValor])
        }
      } else {
        onColorToggle(selectedColors.includes(colorValor) ? [] : [colorValor])
      }
    }
  }

  return (
    <div className="color-selector">
      {colores.map((colorValor) => {
        const isSelected = selectedColors.includes(colorValor)
        return (
          <button
            key={colorValor}
            type="button"
            className={`color-selector-dot${isSelected ? ' selected' : ''}`}
            style={{ backgroundColor: COLOR_HEX_MAP[colorValor] ?? '#e5e7eb' }}
            title={colorValor}
            aria-label={colorValor}
            aria-pressed={isSelected}
            onClick={() => handleColorClick(colorValor)}
          />
        )
      })}
    </div>
  )
}
