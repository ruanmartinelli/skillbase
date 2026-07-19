// "/" focuses the search box, Escape blurs it.
document.addEventListener('keydown', (e) => {
  const input = document.querySelector('input[type=search]')
  if (!input) return
  if (e.key === '/' && document.activeElement !== input) {
    e.preventDefault()
    input.focus()
    input.select()
  } else if (e.key === 'Escape' && document.activeElement === input) {
    input.blur()
  }
})
