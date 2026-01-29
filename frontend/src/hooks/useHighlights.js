import { useState, useEffect, useCallback, useRef } from 'react';

export const useHighlights = (rendition, comments, onHighlightClick) => {
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const highlightedCfisRef = useRef([]);
  const commentsRef = useRef(comments);
  const applyRetryRef = useRef(0);
  const maxRetriesRef = useRef(3);

  // Extract spine position from CFI
  const getSpinePosition = useCallback((cfi) => {
    if (!cfi) return -1;
    // CFI format: /6/XX! where XX is the spine item index * 2
    const match = cfi.match(/\/6\/(\d+)!/);
    return match ? parseInt(match[1]) : -1;
  }, []);

  // Keep comments ref updated
  useEffect(() => {
    commentsRef.current = comments;
    // Reset retry counter when comments change
    applyRetryRef.current = 0;
  }, [comments]);

  // Track current location to filter highlights
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

  // Function to apply highlights with retry logic
  const applyHighlights = useCallback(() => {
    if (!rendition) {
      if (import.meta.env.DEV) {
        console.log('applyHighlights: Rendition not ready');
      }
      return false;
    }

    const currentComments = commentsRef.current;
    const currentCfi = rendition.location?.start?.cfi;
    const currentSpinePos = getSpinePosition(currentCfi);

    // Clear old highlights
    highlightedCfisRef.current.forEach((cfi) => {
      try {
        rendition.annotations.remove(cfi, 'highlight');
      } catch {
        // Ignore removal errors
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

      // Get the spine position of the comment
      const commentSpinePos = getSpinePosition(cfiRange);
      
      // Only apply highlight if comment is on the current page/spine
      if (commentSpinePos !== currentSpinePos) {
        skippedCount++;
        return;
      }

      try {
        // Call highlight
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
          console.warn(`✗ Failed to add highlight for comment ${comment.id}:`, err.message);
        }
      }
    });

    return successCount > 0;
  }, [rendition, onHighlightClick, getSpinePosition]);

  // Listen for rendition ready and content changes
  useEffect(() => {
    if (!rendition) {
      setIsReady(false);
      return;
    }

    const handleDisplayed = () => {
      if (import.meta.env.DEV) {
        console.log('✓ Content displayed');
      }
      setIsReady(true);
      // Larger delay to ensure iframe DOM is fully ready
      setTimeout(() => {
        applyHighlights();
        // Retry for visibility
        if (applyRetryRef.current < maxRetriesRef.current) {
          applyRetryRef.current++;
          setTimeout(() => {
            applyHighlights();
          }, 300 * applyRetryRef.current);
        }
      }, 250);
    };

    const handleRelocated = () => {
      if (import.meta.env.DEV) {
        console.log('✓ Location changed, applying highlights');
      }
      applyRetryRef.current = 0; // Reset retry counter on relocation
      // Larger delay to ensure content is fully rendered after navigation
      setTimeout(() => {
        applyHighlights();
        // Retry multiple times with increasing delays for visibility
        for (let i = 1; i <= maxRetriesRef.current; i++) {
          setTimeout(() => {
            applyHighlights();
          }, 300 * i);
        }
      }, 200);
    };

    // Listen for content being displayed/rendered
    rendition.on('displayed', handleDisplayed);
    rendition.on('rendered', handleDisplayed);
    rendition.on('relocated', handleRelocated);

    // If rendition is already displaying content, apply immediately
    if (rendition.manager?.stage || rendition.views?.length) {
      if (import.meta.env.DEV) {
        console.log('Rendition already ready, applying highlights immediately');
      }
      handleDisplayed();
    }

    return () => {
      rendition.off('displayed', handleDisplayed);
      rendition.off('rendered', handleDisplayed);
      rendition.off('relocated', handleRelocated);

      // Cleanup highlights
      highlightedCfisRef.current.forEach((cfi) => {
        try {
          rendition.annotations.remove(cfi, 'highlight');
        } catch {
          // Ignore cleanup errors
        }
      });
      highlightedCfisRef.current = [];
    };
  }, [rendition, applyHighlights]);

  // Reapply highlights when comments change or location updates
  useEffect(() => {
    if (!isReady || !rendition) return;

    if (import.meta.env.DEV) {
      console.log('Comments changed, reapplying highlights');
    }

    // Reset retry counter when comments change
    applyRetryRef.current = 0;

    // Apply with initial delay for DOM stability
    const timeoutId = setTimeout(() => {
      applyHighlights();
      // Retry multiple times with increasing delays
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
