document.addEventListener('click', async (e) => {
  const button = e.target.closest('.why')
  if (!button) return

  const q = new URLSearchParams(location.search).get('q')
  const dialog = document.getElementById('explain')
  if (!q || !dialog) return

  button.disabled = true
  try {
    const res = await fetch(
      `/api/explain?q=${encodeURIComponent(q)}&id=${button.dataset.id}`,
    )
    if (!res.ok) return
    const { baseScore, contributions } = await res.json()

    dialog.querySelector('#explain-name').textContent =
      button.closest('tr').querySelector('a').textContent
    dialog.querySelector('#explain-score').textContent =
      `similarity ${baseScore.toFixed(3)} — greener words mattered more`

    const max = Math.max(...contributions.map((c) => Math.abs(c.contribution)))
    dialog.querySelector('#explain-chips').replaceChildren(
      ...contributions.map(({ word, contribution }) => {
        const chip = document.createElement('span')
        chip.className = `chip ${contribution < 0 ? 'neg' : 'pos'}`
        chip.style.setProperty(
          '--w',
          (0.15 + 0.65 * (max ? Math.abs(contribution) / max : 0)).toFixed(2),
        )
        chip.textContent = `${word} ${contribution >= 0 ? '+' : ''}${contribution.toFixed(3)}`
        return chip
      }),
    )
    dialog.showModal()
  } finally {
    button.disabled = false
  }
})

document.addEventListener('keydown', (e) => {
  const input = document.querySelector('input[type=search]')

  if (e.key === 'Escape') {
    const dialog = document.getElementById('explain')
    if (dialog?.open) {
      dialog.close()
    } else if (input && document.activeElement === input) {
      input.blur()
    }
    return
  }

  if (input && e.key === '/' && document.activeElement !== input) {
    e.preventDefault()
    input.focus()
    input.select()
  }
})
