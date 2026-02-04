import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

/**
 * Hook for dynamic text pagination that adapts to container size and font settings.
 * Preserves reading position through character offset instead of page numbers.
 */
export const useDynamicPagination = ({
  content,
  containerRef,
  textRef, // ref to the <pre> element for accurate measurement
  fontSize = 100,
  columnCount = 2,
  columnGap = 40,
  initialCharacterOffset = 0,
}) => {
  const [paginationParams, setPaginationParams] = useState({
    linesPerPage: 18,
    symbolsPerLine: 75,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [characterOffset, setCharacterOffset] = useState(initialCharacterOffset)

  const isInitializedRef = useRef(false)
  const previousParamsRef = useRef({ linesPerPage: 18, symbolsPerLine: 75 })
  const resizeTimeoutRef = useRef(null)

  /**
   * Measure actual text dimensions in the container
   */
  const measureDimensions = useCallback(() => {
    if (!containerRef?.current || !textRef?.current) return null

    const container = containerRef.current
    const textElement = textRef.current
    const containerRect = container.getBoundingClientRect()
    const textStyles = window.getComputedStyle(textElement)

    // Get the inner container (with padding) dimensions
    const innerContainer = container.querySelector('div') || container
    const innerStyles = window.getComputedStyle(innerContainer)
    const paddingLeft = parseFloat(innerStyles.paddingLeft) || 0
    const paddingRight = parseFloat(innerStyles.paddingRight) || 0
    const paddingTop = parseFloat(innerStyles.paddingTop) || 0
    const paddingBottom = parseFloat(innerStyles.paddingBottom) || 0

    const availableWidth = containerRect.width - paddingLeft - paddingRight
    const availableHeight = containerRect.height - paddingTop - paddingBottom

    if (availableWidth <= 0 || availableHeight <= 0) return null

    // Get actual column gap from text element styles
    const actualColumnGap = parseFloat(textStyles.columnGap) || columnGap

    const columnWidth =
      columnCount > 1
        ? (availableWidth - actualColumnGap * (columnCount - 1)) / columnCount
        : availableWidth

    // Create measurement element with SAME styles as <pre> element
    const measureEl = document.createElement('pre')
    measureEl.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre;
      font-family: ${textStyles.fontFamily};
      font-size: ${textStyles.fontSize};
      line-height: ${textStyles.lineHeight};
      letter-spacing: ${textStyles.letterSpacing};
    `
    // Use representative mixed text (wide + narrow + cyrillic + spaces)
    // This gives average character width closer to real text
    measureEl.textContent = 'The quick brown fox jumps. Быстрая лиса прыгает.'

    document.body.appendChild(measureEl)

    const charWidth = measureEl.offsetWidth / measureEl.textContent.length
    const lineHeight = measureEl.offsetHeight

    document.body.removeChild(measureEl)

    // LINE_WIDTH_MARGIN: ensures logical lines fit within CSS column width
    // Without this, lines with many wide characters overflow and CSS wraps them,
    // creating extra visual lines (1-2 word "tails") that cause 3rd column overflow
    const LINE_WIDTH_MARGIN = 0.85

    // LINE_COUNT_MARGIN: accounts for word-boundary wrapping
    // Words don't break mid-word, so some lines end earlier, causing more total lines
    const LINE_COUNT_MARGIN = 0.97

    const symbolsPerLine = Math.max(20, Math.floor((columnWidth / charWidth) * LINE_WIDTH_MARGIN))
    const linesPerColumn = Math.max(5, Math.floor(availableHeight / lineHeight))
    const linesPerPage = Math.floor(linesPerColumn * columnCount * LINE_COUNT_MARGIN)

    return {
      linesPerPage,
      symbolsPerLine,
      charWidth,
      lineHeight,
      columnWidth,
      availableHeight,
    }
  }, [containerRef, textRef, fontSize, columnCount, columnGap])

  /**
   * Wrap text into lines based on max line length
   */
  const wrapTextToLines = useCallback((text, maxLineLength) => {
    if (!text) return []

    return text.split('\n').flatMap((paragraph) => {
      if (!paragraph.trim()) return ['']

      const words = paragraph.split(' ')
      const lines = []
      let currentLine = ''

      words.forEach((word) => {
        // Handle words longer than max line length
        if (word.length > maxLineLength) {
          if (currentLine) {
            lines.push(currentLine)
            currentLine = ''
          }
          for (let i = 0; i < word.length; i += maxLineLength) {
            lines.push(word.slice(i, i + maxLineLength))
          }
        } else if (currentLine.length + word.length + 1 > maxLineLength) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine += (currentLine.length ? ' ' : '') + word
        }
      })

      if (currentLine) lines.push(currentLine)
      return lines
    })
  }, [])

  /**
   * Calculate character offset from line index
   */
  const calculateCharacterOffset = useCallback((lines, lineIndex) => {
    let offset = 0
    for (let i = 0; i < lineIndex && i < lines.length; i++) {
      offset += lines[i].length + 1 // +1 for newline
    }
    return offset
  }, [])

  /**
   * Calculate line index from character offset
   */
  const calculateLineIndex = useCallback((lines, charOffset) => {
    let runningOffset = 0
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1
      if (runningOffset + lineLength > charOffset) {
        return i
      }
      runningOffset += lineLength
    }
    return Math.max(0, lines.length - 1)
  }, [])

  /**
   * Wrapped lines memoized
   */
  const wrappedLines = useMemo(() => {
    return wrapTextToLines(content, paginationParams.symbolsPerLine)
  }, [content, paginationParams.symbolsPerLine, wrapTextToLines])

  /**
   * Total pages calculation
   */
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(wrappedLines.length / paginationParams.linesPerPage))
  }, [wrappedLines.length, paginationParams.linesPerPage])

  /**
   * Current page text
   */
  const currentText = useMemo(() => {
    const { linesPerPage } = paginationParams
    const pageLines = wrappedLines.slice(
      (currentPage - 1) * linesPerPage,
      currentPage * linesPerPage
    )
    return pageLines.join('\n').replace(/\n{2,}/g, '\n')
  }, [wrappedLines, currentPage, paginationParams.linesPerPage])

  /**
   * Wrapped text for jump functionality
   */
  const wrappedText = useMemo(() => {
    return wrappedLines.join('\n').replace(/\n{2,}/g, '\n')
  }, [wrappedLines])

  /**
   * Recalculate pagination when dimensions change
   */
  const recalculatePagination = useCallback(() => {
    const dimensions = measureDimensions()
    if (!dimensions || !content) return

    const { linesPerPage, symbolsPerLine } = dimensions
    const prevParams = previousParamsRef.current

    // Only update if parameters actually changed
    if (
      prevParams.symbolsPerLine === symbolsPerLine &&
      prevParams.linesPerPage === linesPerPage
    ) {
      return
    }

    // Recalculate lines with new parameters
    const newLines = wrapTextToLines(content, symbolsPerLine)
    const newTotalPages = Math.max(1, Math.ceil(newLines.length / linesPerPage))

    // Find new page based on current characterOffset
    const lineIndex = calculateLineIndex(newLines, characterOffset)
    const newPage = Math.min(
      newTotalPages,
      Math.max(1, Math.floor(lineIndex / linesPerPage) + 1)
    )

    // Update character offset to start of new page
    const newLineIndex = (newPage - 1) * linesPerPage
    const newCharOffset = calculateCharacterOffset(newLines, newLineIndex)

    setCurrentPage(newPage)
    setCharacterOffset(newCharOffset)
    setPaginationParams({ linesPerPage, symbolsPerLine })
    previousParamsRef.current = { linesPerPage, symbolsPerLine }
  }, [
    content,
    measureDimensions,
    characterOffset,
    wrapTextToLines,
    calculateLineIndex,
    calculateCharacterOffset,
  ])

  /**
   * Debounced recalculation for resize events
   */
  const debouncedRecalculate = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    resizeTimeoutRef.current = setTimeout(recalculatePagination, 150)
  }, [recalculatePagination])

  /**
   * Handle window resize
   */
  useEffect(() => {
    window.addEventListener('resize', debouncedRecalculate)
    return () => {
      window.removeEventListener('resize', debouncedRecalculate)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [debouncedRecalculate])

  /**
   * Recalculate when fontSize changes
   */
  useEffect(() => {
    if (isInitializedRef.current) {
      recalculatePagination()
    }
  }, [fontSize, recalculatePagination])

  /**
   * Initialize on first render
   */
  useEffect(() => {
    if (!isInitializedRef.current && content && containerRef?.current) {
      // Small delay to ensure container is rendered
      const timer = setTimeout(() => {
        recalculatePagination()
        isInitializedRef.current = true
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [content, containerRef, recalculatePagination])

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback(
    (pageNumber) => {
      const targetPage = Math.max(1, Math.min(totalPages, pageNumber))
      const lineIndex = (targetPage - 1) * paginationParams.linesPerPage
      const newCharOffset = calculateCharacterOffset(wrappedLines, lineIndex)

      setCurrentPage(targetPage)
      setCharacterOffset(newCharOffset)
    },
    [totalPages, paginationParams.linesPerPage, wrappedLines, calculateCharacterOffset]
  )

  const goToPrevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])
  const goToNextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])

  /**
   * Restore position from saved character offset
   */
  const restorePosition = useCallback(
    (savedCharOffset) => {
      if (!content || savedCharOffset < 0) return

      const lineIndex = calculateLineIndex(wrappedLines, savedCharOffset)
      const page = Math.floor(lineIndex / paginationParams.linesPerPage) + 1
      const targetPage = Math.max(1, Math.min(totalPages, page))

      setCurrentPage(targetPage)
      setCharacterOffset(savedCharOffset)
    },
    [content, wrappedLines, paginationParams.linesPerPage, totalPages, calculateLineIndex]
  )

  return {
    // Pagination parameters
    linesPerPage: paginationParams.linesPerPage,
    symbolsPerLine: paginationParams.symbolsPerLine,

    // Position state
    currentPage,
    totalPages,
    characterOffset,

    // Text data
    currentText,
    wrappedText,
    wrappedLines,

    // Navigation methods
    goToPage,
    goToPrevPage,
    goToNextPage,

    // Position restoration
    restorePosition,

    // Manual recalculation
    recalculate: recalculatePagination,
    debouncedRecalculate,
  }
}

export default useDynamicPagination
