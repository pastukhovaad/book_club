import { useState, useEffect, useCallback, useRef } from 'react';

export const useHighlights = (rendition, comments, onHighlightClick) => {
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const highlightedCfisRef = useRef([]);
  const commentsRef = useRef(comments);
  const applyRetryRef = useRef(0);
  const maxRetriesRef = useRef(3);

  const getSpinePosition = useCallback((cfi) => {
    if (!cfi) return -1;
    const match = cfi.match(/\/6\/(\d+)!/);
    return match ? parseInt(match[1]) : -1;
  }, []);

  useEffect(() => {
    commentsRef.current = comments;
    applyRetryRef.current = 0;
  }, [comments]);

  useEffect(() => {
    if (!rendition) return;

    const handleRelocated = (location) => {
      setCurrentLocation(location);
    };

    rendition.on('relocated', handleRelocated);
    return () => {
      rendition.off('relocated', handleRelocated);
    };
  }, [rendition]);

  const applyHighlights = useCallback(() => {
    const currentComments = commentsRef.current;
    const currentCfi = rendition.location?.start?.cfi;
    const currentSpinePos = getSpinePosition(currentCfi);

    highlightedCfisRef.current.forEach((cfi) => {
      try {
        rendition.annotations.remove(cfi, 'highlight');
      } catch {
        // .
      }
    });
    highlightedCfisRef.current = [];

    if (!currentComments?.length) {
      return true;
    }

    let successCount = 0;
    let skippedCount = 0;

    currentComments.forEach((comment) => {
      const cfiRange = comment.cfi_range?.trim();
      if (!cfiRange) {
        return;
      }

      const commentSpinePos = getSpinePosition(cfiRange);
      
      if (commentSpinePos !== currentSpinePos) {
        skippedCount++;
        return;
      }

      try {
        rendition.annotations.highlight(
          cfiRange,
          { id: comment.id },
          () => {
            if (onHighlightClick) {
              onHighlightClick(comment);
            }
            setActiveCommentId(comment.id);
          },
          'highlight',
          {
            fill: comment.highlight_color || '#FFFF00',
            'fill-opacity': '0.3',
          }
        );
        highlightedCfisRef.current.push(cfiRange);
        successCount++;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`Failed to add highlight for comment ${comment.id}:`, err.message);
        }
      }
    });

    return successCount > 0;
  }, [rendition, onHighlightClick, getSpinePosition]);

  useEffect(() => {
    if (!rendition) {
      setIsReady(false);
      return;
    }

    const handleDisplayed = () => {
      setIsReady(true);
      setTimeout(() => {
        applyHighlights();
        if (applyRetryRef.current < maxRetriesRef.current) {
          applyRetryRef.current++;
          setTimeout(() => {
            applyHighlights();
          }, 300 * applyRetryRef.current);
        }
      }, 250);
    };

    const handleRelocated = () => {
      applyRetryRef.current = 0;
      setTimeout(() => {
        applyHighlights();
        for (let i = 1; i <= maxRetriesRef.current; i++) {
          setTimeout(() => {
            applyHighlights();
          }, 300 * i);
        }
      }, 200);
    };

    rendition.on('displayed', handleDisplayed);
    rendition.on('rendered', handleDisplayed);
    rendition.on('relocated', handleRelocated);

    if (rendition.manager?.stage || rendition.views?.length) {
      handleDisplayed();
    }

    return () => {
      rendition.off('displayed', handleDisplayed);
      rendition.off('rendered', handleDisplayed);
      rendition.off('relocated', handleRelocated);

      highlightedCfisRef.current.forEach((cfi) => {
        try {
          rendition.annotations.remove(cfi, 'highlight');
        } catch {
          // .
        }
      });
      highlightedCfisRef.current = [];
    };
  }, [rendition, applyHighlights]);

  useEffect(() => {
    if (!isReady || !rendition) return;

    applyRetryRef.current = 0;

    const timeoutId = setTimeout(() => {
      applyHighlights();
      for (let i = 1; i <= maxRetriesRef.current; i++) {
        setTimeout(() => {
          applyHighlights();
        }, 300 * i);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [comments, isReady, applyHighlights, rendition]);

  const clearActiveComment = useCallback(() => {
    setActiveCommentId(null);
  }, []);

  return {
    activeCommentId,
    setActiveCommentId,
    clearActiveComment,
  };
};


export default useHighlights;
