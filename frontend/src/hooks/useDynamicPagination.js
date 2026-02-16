import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

export const useDynamicPagination = ({
  content,
  containerRef,
  textRef,
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

  const measureDimensions = useCallback(() => {
    if (!containerRef?.current || !textRef?.current) return null

    const container = containerRef.current
    const textElement = textRef.current
    const containerRect = container.getBoundingClientRect()
    const textStyles = window.getComputedStyle(textElement)

    const innerContainer = container.querySelector('div') || container
    const innerStyles = window.getComputedStyle(innerContainer)
    const paddingLeft = parseFloat(innerStyles.paddingLeft) || 0
    const paddingRight = parseFloat(innerStyles.paddingRight) || 0
    const paddingTop = parseFloat(innerStyles.paddingTop) || 0
    const paddingBottom = parseFloat(innerStyles.paddingBottom) || 0

    const availableWidth = containerRect.width - paddingLeft - paddingRight
    const availableHeight = containerRect.height - paddingTop - paddingBottom

    if (availableWidth <= 0 || availableHeight <= 0) return null

    const actualColumnGap = parseFloat(textStyles.columnGap) || columnGap

    const columnWidth =
      columnCount > 1
        ? (availableWidth - actualColumnGap * (columnCount - 1)) / columnCount
        : availableWidth

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
    measureEl.textContent = 'The quick brown fox jumps. Быстрая лиса прыгает.'

    document.body.appendChild(measureEl)

    const charWidth = measureEl.offsetWidth / measureEl.textContent.length
    const lineHeight = measureEl.offsetHeight

    document.body.removeChild(measureEl)

    const LINE_WIDTH_MARGIN = 0.85

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

  const wrapTextToLines = useCallback((text, maxLineLength) => {
    if (!text) return []

    return text.split('\n').flatMap((paragraph) => {
      if (!paragraph.trim()) return ['']

      const words = paragraph.split(' ')
      const lines = []
      let currentLine = ''

      words.forEach((word) => {
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

  const calculateCharacterOffset = useCallback((lines, lineIndex) => {
    let offset = 0
    for (let i = 0; i < lineIndex && i < lines.length; i++) {
      offset += lines[i].length + 1
    }
    return offset
  }, [])

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

  const wrappedLines = useMemo(() => {
    return wrapTextToLines(content, paginationParams.symbolsPerLine)
  }, [content, paginationParams.symbolsPerLine, wrapTextToLines])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(wrappedLines.length / paginationParams.linesPerPage))
  }, [wrappedLines.length, paginationParams.linesPerPage])

  const currentText = useMemo(() => {
    const { linesPerPage } = paginationParams
    const pageLines = wrappedLines.slice(
      (currentPage - 1) * linesPerPage,
      currentPage * linesPerPage
    )
    return pageLines.join('\n').replace(/\n{2,}/g, '\n')
  }, [wrappedLines, currentPage, paginationParams.linesPerPage])

  const wrappedText = useMemo(() => {
    return wrappedLines.join('\n').replace(/\n{2,}/g, '\n')
  }, [wrappedLines])

  const recalculatePagination = useCallback(() => {
    const dimensions = measureDimensions()
    if (!dimensions || !content) return

    const { linesPerPage, symbolsPerLine } = dimensions
    const prevParams = previousParamsRef.current

    if (
      prevParams.symbolsPerLine === symbolsPerLine &&
      prevParams.linesPerPage === linesPerPage
    ) {
      return
    }

    const newLines = wrapTextToLines(content, symbolsPerLine)
    const newTotalPages = Math.max(1, Math.ceil(newLines.length / linesPerPage))

    const lineIndex = calculateLineIndex(newLines, characterOffset)
    const newPage = Math.min(
      newTotalPages,
      Math.max(1, Math.floor(lineIndex / linesPerPage) + 1)
    )

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

  const debouncedRecalculate = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    resizeTimeoutRef.current = setTimeout(recalculatePagination, 150)
  }, [recalculatePagination])

  useEffect(() => {
    window.addEventListener('resize', debouncedRecalculate)
    return () => {
      window.removeEventListener('resize', debouncedRecalculate)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [debouncedRecalculate])

  useEffect(() => {
    if (isInitializedRef.current) {
      recalculatePagination()
    }
  }, [fontSize, recalculatePagination])

  useEffect(() => {
    if (!isInitializedRef.current && content && containerRef?.current) {
      const timer = setTimeout(() => {
        recalculatePagination()
        isInitializedRef.current = true
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [content, containerRef, recalculatePagination])

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
    linesPerPage: paginationParams.linesPerPage,
    symbolsPerLine: paginationParams.symbolsPerLine,

    currentPage,
    totalPages,
    characterOffset,

    currentText,
    wrappedText,
    wrappedLines,

    goToPage,
    goToPrevPage,
    goToNextPage,

    restorePosition,

    recalculate: recalculatePagination,
    debouncedRecalculate,
  }
}

export default useDynamicPagination
