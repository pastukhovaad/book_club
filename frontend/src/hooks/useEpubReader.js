import { useState, useEffect, useCallback, useRef } from 'react';

export const useEpubReader = () => {
  const [location, setLocation] = useState(null);
  const [fontSize, setFontSize] = useState(100);
  const [showToc, setShowToc] = useState(false);
  const [rendition, setRendition] = useState(null);
  const [tocFromEpub, setTocFromEpub] = useState([]);

  useEffect(() => {
  }, [location]);

  const normalizeHref = useCallback((href) => {
    if (!href) return href;

    let normalized = href.trim();

    normalized = normalized.split('#')[0];

    try {
      normalized = decodeURIComponent(normalized);
    } catch {
      // .
    }

    if (normalized.startsWith('./')) {
      normalized = normalized.slice(2);
    }

    return normalized;
  }, []);

  const navigationRef = useRef({
    isNavigating: false,
    navigationId: 0,
  });

  useEffect(() => {
    if (rendition) {
      rendition.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize, rendition]);

  useEffect(() => {
    if (!rendition) return;

    const handleResize = () => {
      rendition.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [rendition]);

  useEffect(() => {
    if (!rendition) return;

    const handleKeyDown = (e) => {
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
      const book = rendition.book;

      const anchor = href.includes('#') ? href.split('#')[1] : null;
      const hrefWithoutAnchor = normalizeHref(href);

      let spineItem = null;
      let spineIndex = -1;

      if (book?.spine) {
        spineItem = book.spine.get(hrefWithoutAnchor);

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

      }

      const performNavigation = async () => {
        navigationRef.current.navigationId += 1;
        const currentNavId = navigationRef.current.navigationId;
        navigationRef.current.isNavigating = true;

        let targetCfi = null;

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
                }
              }
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              console.error('Error finding anchor:', err);
            }
          }
        }

        const target = targetCfi || spineItem.href;

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

      performNavigation();
      setShowToc(false);
    },
    [rendition, setLocation, normalizeHref]
  );

  const handleJumpToLocation = useCallback(
    (cfiRange) => {

      navigationRef.current.navigationId += 1;
      const currentNavId = navigationRef.current.navigationId;
      navigationRef.current.isNavigating = true;

      rendition.display(cfiRange).then(() => {
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
    setTocFromEpub(toc);
  }, []);

  return {
    location,
    setLocation,
    fontSize,
    showToc,
    setShowToc,
    rendition,
    tocFromEpub,

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
