import { useState, useEffect, useCallback } from 'react';

export const useTextSelection = (rendition) => {
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [commentButtonPosition, setCommentButtonPosition] = useState({ x: 0, y: 0 });
  const [selectedTextData, setSelectedTextData] = useState(null);

  // Setup text selection listener
  useEffect(() => {
    if (!rendition) return;

    const handleSelected = (cfiRange, contents) => {
      const selection = contents.window.getSelection();
      const text = selection.toString().trim();

      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const iframe = contents.document.defaultView.frameElement;

        if (iframe) {
          const iframeRect = iframe.getBoundingClientRect();
          setCommentButtonPosition({
            x: iframeRect.left + rect.left + rect.width / 2,
            y: iframeRect.top + rect.top + window.scrollY,
          });
        } else {
          setCommentButtonPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY,
          });
        }

        setSelectedTextData({
          cfiRange,
          text,
        });

        setShowCommentButton(true);
      }
    };

    const handleClick = () => {
      setShowCommentButton(false);
    };

    rendition.on('selected', handleSelected);
    rendition.on('click', handleClick);

    return () => {
      rendition.off('selected', handleSelected);
      rendition.off('click', handleClick);
    };
  }, [rendition]);

  const hideCommentButton = useCallback(() => {
    setShowCommentButton(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTextData(null);
    setShowCommentButton(false);
  }, []);

  return {
    showCommentButton,
    commentButtonPosition,
    selectedTextData,
    hideCommentButton,
    clearSelection,
  };
};

export default useTextSelection;
