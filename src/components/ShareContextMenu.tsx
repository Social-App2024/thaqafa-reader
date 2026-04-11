import { useState, useEffect } from 'react';
import shareQuote from "../api/ShareCommand"
import NotificationManager from "./NotificationManager";
import { usePubSub } from "../context/PubSubContext";
import { useTranslation } from 'react-i18next';

export const ShareContextMenu = () => {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; bookTitle: string; bookAuthor: string } | null>(null)
    const [shareDialog, setShareDialog] = useState<{ imageUrl: string; text: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const bookTitle = contextMenu?.bookTitle || '';
    const bookAuthor = contextMenu?.bookAuthor || '';

    // Use global PubSub from context
    const pubsub = usePubSub();

    // Get NotificationManager singleton instance
    const notificationManager = NotificationManager.getInstance(pubsub);

    // Get translation function with fallback
    const { t, i18n } = useTranslation();

    // Debug: log current language
    useEffect(() => {
        console.log('[ShareContextMenu] Current language:', i18n.language);
        console.log('[ShareContextMenu] Translation test:', t('share.button'));
    }, [i18n.language, t]);

    // Subscribe to showContextMenu event from PubSub (true decoupling)
    useEffect(() => {
        const subscription = pubsub.subscribe('showContextMenu', (_topic: string, data: any) => {
            console.log('[ShareContextMenu] Received showContextMenu event:', data);
            setContextMenu(data);
        });

        return () => {
            pubsub.unsubscribe(subscription);
        };
    }, [pubsub]);

    // Subscribe to closeContextMenu event
    useEffect(() => {
        const subscription = pubsub.subscribe('closeContextMenu', () => {
            setContextMenu(null);
        });

        return () => {
            pubsub.unsubscribe(subscription);
        };
    }, [pubsub]);

    const generateShareImage = (text: string, title: string, author: string): string => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
    
        if (!ctx) return ''
    
        // Set canvas width
        canvas.width = 800
        const padding = 60
        const contentWidth = canvas.width - (padding * 2)
    
        // Font sizes matching original book proportions (smaller, book-like sizes)
        const quoteFontSize = 18 // Main text size (similar to book text)
        const titleFontSize = 14 // Book title (proportional ratio preserved)
        const authorFontSize = 12 // Author name (proportional ratio preserved)
        const quotationMarkSize = 40 // Decorative quote (proportional ratio preserved)
    
        // Calculate required height based on text
        ctx.font = `bold ${quoteFontSize}px Arial`
        const words = text.split(' ')
        let line = ''
        let lineCount = 0
        const lineHeight = quoteFontSize * 1.6 // Line height proportional to font size
    
        // Count lines needed
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          const metrics = ctx.measureText(testLine)
    
          if (metrics.width > contentWidth && i > 0) {
            lineCount++
            line = words[i] + ' '
          } else {
            line = testLine
          }
        }
        lineCount++ // Add the last line
    
        // Calculate dynamic height
        const topPadding = 80
        const bottomPadding = 100
        canvas.height = topPadding + (lineCount * lineHeight) + bottomPadding
    
        // Background - off-white color
        ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    
        // Draw decorative quote marks
        ctx.font = `bold ${quotationMarkSize}px Georgia`
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
        ctx.fillText('"', padding - 10, 60)
    
        // Draw quote text
        ctx.fillStyle = '#000000'
        ctx.font = `bold ${quoteFontSize}px Arial`
        ctx.textAlign = 'left'
    
        // Word wrap the text
        line = ''
        let y = topPadding
    
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          const metrics = ctx.measureText(testLine)
    
          if (metrics.width > contentWidth && i > 0) {
            ctx.fillText(line, padding, y)
            line = words[i] + ' '
            y += lineHeight
          } else {
            line = testLine
          }
        }
    
        ctx.fillText(line, padding, y)
    
        // Draw book info
        y += 50
        ctx.fillStyle = '#000000'
        ctx.font = `italic ${titleFontSize}px Arial`
        ctx.fillText(`— ${title}`, padding, y)
    
        ctx.font = `${authorFontSize}px Arial`
        ctx.fillText(`by ${author}`, padding, y + 22)
    
        return canvas.toDataURL('image/png')
      }
      
    const handleShare = () => {
        if (contextMenu?.text) {
        console.log(`shared text: ${contextMenu.text}`)

        // Generate share image
        const imageUrl = generateShareImage(contextMenu.text, bookTitle, bookAuthor)

        // Show dialog with image and clear any previous errors
        setShareDialog({
            imageUrl,
            text: contextMenu.text
        })
        setError(null)
        }

        // Close context menu after opening share dialog
        setContextMenu(null)
    }

    const closeShareDialog = () => {
        setShareDialog(null)
    }

    return (
        <>
        {contextMenu && (
            <div
            className="fixed bg-gray-200 text-gray-700 rounded shadow-lg z-50"
            style={{
                left: contextMenu.x,
                top: contextMenu.y,
                transform: 'translateX(-50%)'
            }}
            >
            <button
                className="px-3 py-1 hover:bg-gray-300 w-full text-left text-sm"
                onClick={handleShare}
            >
                {t('share.button')}
            </button>
            </div>
        )}
        {shareDialog && (
            <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeShareDialog}
            >
            <div
                className="bg-white rounded-lg shadow-xl p-4 max-w-3xl max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-gray-800">{t('share.title')}</h2>
                <button
                    onClick={closeShareDialog}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                    &times;
                </button>
                </div>

                <div className="mb-3">
                <img
                    src={shareDialog.imageUrl}
                    alt="Share quote"
                    className="w-full rounded-lg shadow-md"
                />
                </div>

                <div className="flex gap-2 justify-between items-center">
                {error && (
                    <div className="text-red-600 text-sm">
                        {error}
                    </div>
                )}
                <div className="flex gap-2 ms-auto">
                <button
                    onClick={async () => {
                    try {
                        // Clear any previous errors
                        setError(null);

                        // Execute share command using Command pattern with Factory
                        await shareQuote({
                            imageUrl: shareDialog.imageUrl,
                            text: shareDialog.text,
                            bookTitle: bookTitle,
                            bookAuthor: bookAuthor
                        });

                        // Show success notification using Singleton NotificationManager
                        notificationManager.success(t('share.success'));

                        // Close the dialog after successful share
                        closeShareDialog();

                        // Original download logic (kept for reference)
                        // const link = document.createElement('a')
                        // link.download = 'quote.png'
                        // link.href = shareDialog.imageUrl
                        // link.click()
                    } catch (err) {
                        // Always use localized error message
                        const errorMessage = t('share.error');
                        console.error('Share error:', err);
                        setError(errorMessage);
                        notificationManager.error(errorMessage);
                    }
                    }}
                    className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-700"
                >
                    {t('share.button')}
                </button>
                <button
                    onClick={closeShareDialog}
                    className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    {t('share.close')}
                </button>
                </div>
                </div>
            </div>
            </div>
        )}
        </>
    )
}