'use client';

import { useState } from 'react';
import { Search, Upload, X, Star } from 'lucide-react';

export default function VisualSearch() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [bestMatch, setBestMatch] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isConnectionError, setIsConnectionError] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const MAX_SIZE = 20 * 1024 * 1024;
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
            setIsConnectionError(false);
            return;
        }
        if (file.size > MAX_SIZE) {
            setError('File is too large. Maximum size is 20MB.');
            setIsConnectionError(false);
            return;
        }

        setError(null);
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        handleSearch(file);
    };

    const handleSearch = async (file) => {
        setLoading(true);
        setError(null);
        setIsConnectionError(false);
        setBestMatch(null);
        setSimilar([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/visual-search', {
                method: 'POST',
                body: formData,
            });
            let data = {};
            try { data = await response.json(); } catch { data = {}; }
            if (!response.ok) {
                const isServiceDown = response.status === 503 || response.status === 500;
                setIsConnectionError(isServiceDown);
                throw new Error(data.error || 'Search failed');
            }
            if (data.message === 'No result found') {
                setBestMatch(null);
                setSimilar([]);
                setError('Product not found');
                setIsConnectionError(false);
            } else if (data.best_match !== undefined) {
                setBestMatch(data.best_match || null);
                setSimilar(Array.isArray(data.similar) ? data.similar : []);
            } else {
                setBestMatch(null);
                setSimilar([]);
                setError('Product not found');
                setIsConnectionError(false);
            }
        } catch (err) {
            setError(err.message || 'Visual search failed. Check backend connection.');
            setIsConnectionError(true);
        } finally {
            setLoading(false);
        }
    };

    const closeSearch = () => {
        setIsOpen(false);
        setSelectedImage(null);
        setPreviewUrl(null);
        setBestMatch(null);
        setSimilar([]);
        setError(null);
    };

    const ProductCard = ({ product, large = false }) => (
        <div className={`bg-[#0f192f] rounded-xl overflow-hidden group hover:ring-2 ring-amber-500 transition-all cursor-pointer ${large ? 'flex gap-4 p-3' : ''}`}>
            <div className={`bg-gray-800 relative overflow-hidden flex-shrink-0 ${large ? 'w-32 h-32 rounded-lg' : 'aspect-square'}`}>
                <img
                    src={product.imageUrl || (product.path ? `/api/images/${encodeURIComponent(product.path)}` : '')}
                    alt={product.name || 'Result'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop';
                    }}
                />
                <div className="absolute top-2 right-2 bg-black/60 text-[10px] px-2 py-1 rounded text-white backdrop-blur-sm">
                    {Math.round((product.score || 0) * 100)}% match
                </div>
            </div>
            <div className={`${large ? 'flex flex-col justify-center' : 'p-2'}`}>
                <p className={`text-white font-semibold truncate ${large ? 'text-base mb-1' : 'text-xs'}`}>{product.name}</p>
                {product.category && (
                    <p className={`text-gray-400 truncate ${large ? 'text-sm mb-2' : 'text-[10px]'}`}>{product.category}</p>
                )}
                {product.price && (
                    <p className={`text-amber-400 font-bold ${large ? 'text-lg' : 'text-xs'}`}>${product.price}</p>
                )}
            </div>
        </div>
    );

    const hasResults = bestMatch || similar.length > 0;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg transition-all z-50 flex items-center gap-2"
                title="Visual Search"
            >
                <Search className="w-6 h-6" />
                <span className="font-semibold">Visual Search</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a2333] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden modal-enter">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#151d2b]">
                    <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        AI Visual Search
                    </h2>
                    <button onClick={closeSearch} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload area */}
                    <div className="w-full h-40 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 rounded-xl border-2 border-dashed border-gray-700 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Query" className="h-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                                <Upload className="w-10 h-10 text-gray-500 group-hover:text-amber-500 transition-colors mb-2" />
                                <span className="text-sm text-gray-400 group-hover:text-gray-200">Click to upload an image</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageSelect} />
                    </div>

                    {/* States */}
                    {error ? (
                        <div className={`border rounded-xl p-5 ${isConnectionError ? 'bg-red-500/10 border-red-500/50 text-red-200' : 'bg-slate-800/60 border-white/10 text-slate-300'}`}>
                            <h4 className="font-bold mb-1 text-base">
                                {isConnectionError ? '⚠️ Search service offline' : '🔍 Product not found'}
                            </h4>
                            <p className="text-sm">
                            {isConnectionError
                                ? 'The AI Visual Search service is not available in this deployment. To use visual search, the Python search service needs to be running separately.'
                                : 'This product does not match any item in our catalog. Try uploading a clearer photo of a product from our supported categories: Smartphones, Appliances, Sofas, Tables, Shoes, Jackets, Jeans, Cookware, Dinnerware, or Sports equipment.'}
                        </p>
                        </div>
                    ) : loading ? (
                        <div className="h-48 flex flex-col items-center justify-center space-y-4 border border-gray-800 rounded-xl bg-[#0f192f]">
                            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                            <p className="text-gray-400 animate-pulse text-sm">Analyzing image...</p>
                        </div>
                    ) : !hasResults ? (
                        <div className="h-48 flex items-center justify-center text-gray-500 italic border border-gray-800 rounded-xl bg-[#0f192f] text-sm">
                            {previewUrl ? '🔍 Product not found' : 'Upload an image to find similar products'}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {bestMatch && (
                                <div>
                                    <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1 mb-2">
                                        <Star className="w-4 h-4 fill-amber-400" /> Best Match
                                    </h3>
                                    <ProductCard product={bestMatch} large={true} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
