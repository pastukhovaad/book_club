import { useState, useEffect, useCallback, useRef } from 'react';

export const useEpubReader = () => {
  const [location, setLocation] = useState(null);
  const [fontSize, setFontSize] = useState(100);
  const [showToc, setShowToc] = useState(false);
  const [rendition, setRendition] = useState(null);
  const [tocFromEpub, setTocFromEpub] = useState([]);

  const normalizeHref = useCallback((href) => {
    if (!href) return href;

    let normalized = href.trim();

    // Remove hash part for spine lookup
    normalized = normalized.split('#')[0];

    // Try to decode URL-encoded hrefs
    try {
      normalized = decodeURIComponent(normalized);
    } catch {
      // Keep original if decoding fails
    }

    // Normalize leading "./"
    if (normalized.startsWith('./')) {
      normalized = normalized.slice(2);
    }

    return normalized;
  }, []);

  // Navigation guard to prevent concurrent navigations
  const navigationRef = useRef({
    isNavigating: false,
    navigationId: 0,
  });

  // Apply font size when rendition is ready
  useEffect(() => {
    if (rendition) {
      rendition.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize, rendition]);

  // Handle window resize
  useEffect(() => {
    if (!rendition) return;

    const handleResize = () => {
      rendition.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [rendition]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!rendition) return;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        rendition.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        rendition.next();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rendition]);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 10, 200));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 10, 50));
  }, []);

  const goToPrevPage = useCallback(() => {
    if (navigationRef.current.isNavigating) return;
    if (rendition) {
      rendition.prev();
    }
  }, [rendition]);

  const goToNextPage = useCallback(() => {
    if (navigationRef.current.isNavigating) return;
    if (rendition) {
      rendition.next();
    }
  }, [rendition]);

  const handleChapterClick = useCallback(
    (href) => {
      if (!href) {
        if (import.meta.env.DEV) {
          console.warn('handleChapterClick: No href provided');
        }
        return;
      }

      if (!rendition) {
        if (import.meta.env.DEV) {
          console.warn('handleChapterClick: Rendition not ready');
        }
        return;
      }

      const book = rendition.book;

      const anchor = href.includes('#') ? href.split('#')[1] : null;
      const hrefWithoutAnchor = normalizeHref(href);

      if (import.meta.env.DEV) {
        console.log('Navigating to chapter:', href);
        console.log('Href without anchor:', hrefWithoutAnchor);
        console.log('Anchor:', anchor);
        console.log('Current location before:', rendition.location?.start?.cfi);
      }

      // Try to find the section in the spine
      let spineItem = null;
      let spineIndex = -1;

      if (book?.spine) {
        spineItem = book.spine.get(hrefWithoutAnchor);

        // If not found directly, try to find by matching end of href
        if (!spineItem && book.spine.items) {
          const foundIndex = book.spine.items.findIndex(item =>
            item.href === hrefWithoutAnchor ||
            item.href.endsWith('/' + hrefWithoutAnchor) ||
            item.href.endsWith(hrefWithoutAnchor) ||
            hrefWithoutAnchor.endsWith('/' + item.href) ||
            hrefWithoutAnchor.endsWith(item.href)
          );
          if (foundIndex !== -1) {
            spineItem = book.spine.items[foundIndex];
            spineIndex = foundIndex;
          }
        } else if (spineItem) {
          spineIndex = book.spine.items?.findIndex(item => item.href === spineItem.href) ?? -1;
        }

        if (import.meta.env.DEV) {
          console.log('Spine item found:', spineItem ? spineItem.href : 'NOT FOUND');
          console.log('Spine index:', spineIndex);
          if (!spineItem) {
            console.log('Available spine items:', book.spine.items?.map(i => i.href));
          }
        }
      }

      // Single navigation - determine target CFI first, then navigate once
      const performNavigation = async () => {
        if (!spineItem) {
          if (import.meta.env.DEV) {
            console.warn('No spine item found, cannot navigate');
          }
          return;
        }

        // Cancel any previous navigation and start new one
        navigationRef.current.navigationId += 1;
        const currentNavId = navigationRef.current.navigationId;
        navigationRef.current.isNavigating = true;

        if (import.meta.env.DEV) {
          console.log(`Starting navigation #${currentNavId}`);
        }

        let targetCfi = null;

        // If there's an anchor, find its CFI first
        if (anchor) {
          try {
            const section = book.spine.get(spineItem.href);
            if (section) {
              await section.load(book.load.bind(book));
              const doc = section.document;
              if (doc) {
                const element = doc.getElementById(anchor) ||
                                doc.querySelector(`[name="${anchor}"]`) ||
                                doc.querySelector(`a[id="${anchor}"]`);
                if (element) {
                  targetCfi = section.cfiFromElement(element);
                  if (import.meta.env.DEV) {
                    console.log('Found anchor CFI:', targetCfi);
                  }
                } else if (import.meta.env.DEV) {
                  console.warn('Anchor element not found:', anchor);
                }
              }
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              console.error('Error finding anchor:', err);
            }
          }
        }

        // Check if this navigation was cancelled
        if (navigationRef.current.navigationId !== currentNavId) {
          if (import.meta.env.DEV) {
            console.log(`Navigation #${currentNavId} cancelled`);
          }
          return;
        }

        // Fallback to spine item href if no anchor CFI found
        const target = targetCfi || spineItem.href;

        if (import.meta.env.DEV) {
          console.log('Navigating to:', target);
        }

        try {
          await rendition.display(target);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('Navigation error:', err);
          }
        } finally {
          if (navigationRef.current.navigationId === currentNavId) {
            navigationRef.current.isNavigating = false;
          }
        }
      };

      // Execute navigation
      performNavigation();
      setShowToc(false);
    },
    [rendition, setLocation, normalizeHref]
  );

  const handleJumpToLocation = useCallback(
    (cfiRange) => {
      if (!cfiRange) {
        if (import.meta.env.DEV) {
          console.warn('handleJumpToLocation: No CFI range provided');
        }
        return;
      }

      if (!rendition) {
        if (import.meta.env.DEV) {
          console.warn('handleJumpToLocation: Rendition not ready');
        }
        return;
      }

      if (import.meta.env.DEV) {
        console.log('Jumping to CFI:', cfiRange);
      }

      navigationRef.current.navigationId += 1;
      const currentNavId = navigationRef.current.navigationId;
      navigationRef.current.isNavigating = true;

      rendition.display(cfiRange).then(() => {
        if (import.meta.env.DEV) {
          console.log('Navigation complete');
        }
      }).catch((err) => {
        if (import.meta.env.DEV) {
          console.error('Navigation failed:', err);
        }
      }).finally(() => {
        if (navigationRef.current.navigationId === currentNavId) {
          navigationRef.current.isNavigating = false;
        }
      });
    },
    [rendition]
  );

  const toggleToc = useCallback(() => {
    setShowToc((prev) => !prev);
  }, []);

  const handleGetRendition = useCallback(
    (rend) => {
      setRendition(rend);
      rend.themes.fontSize(`${fontSize}%`);
    },
    [fontSize]
  );

  const handleTocChanged = useCallback((toc) => {
    if (import.meta.env.DEV) {
      console.log('TOC loaded:', toc?.map(item => ({ label: item.label, href: item.href })));
    }
    setTocFromEpub(toc);
  }, []);

  return {
    // State
    location,
    setLocation,
    fontSize,
    showToc,
    setShowToc,
    rendition,
    tocFromEpub,

    // Handlers
    increaseFontSize,
    decreaseFontSize,
    goToPrevPage,
    goToNextPage,
    handleChapterClick,
    handleJumpToLocation,
    toggleToc,
    handleGetRendition,
    handleTocChanged,
  };
};

export default useEpubReader;
