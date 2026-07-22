'use client';
import { useEffect } from 'react';

export default function TrackView({ productId }) {
    useEffect(() => {
        if (!productId) return;
        fetch('/api/demand/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, event: 'view' }),
        }).catch(() => {}); // silent — never break the page
    }, [productId]);

    return null;
}
