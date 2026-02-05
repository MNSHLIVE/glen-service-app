import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config';

interface FeedbackFormProps {
    ticketId: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ ticketId }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ticketData, setTicketData] = useState<any>(null);

    const { BRANDING } = APP_CONFIG;

    useEffect(() => {
        const fetchTicket = async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select('customer_name, technician_name')
                .eq('id', ticketId)
                .single();

            if (data) setTicketData(data);
        };
        fetchTicket();
    }, [ticketId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            alert("Please select a star rating");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('feedback')
                .insert([{
                    id: `FB-${Date.now()}`,
                    ticket_id: ticketId,
                    rating: rating,
                    comment: comment,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            setIsSubmitted(true);
        } catch (err: any) {
            console.error("Feedback submission error:", err);
            setError("Failed to submit feedback. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Thank You!</h2>
                <p className="text-gray-600">Your feedback has been successfully submitted. It helps us improve our service.</p>
                <div className="mt-8 text-sm text-gray-400 font-medium uppercase tracking-widest">
                    {BRANDING?.companyName}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-2xl mt-8 border border-gray-100">
            <div className="text-center mb-8">
                <div className="inline-block p-4 bg-blue-50 rounded-2xl mb-4">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/6009/6009864.png"
                        alt="Logo"
                        className="w-12 h-12"
                    />
                </div>
                <h1 className="text-2xl font-black text-gray-900 leading-tight">Rate Your Experience</h1>
                {ticketData && (
                    <p className="text-gray-500 mt-2 text-sm italic">
                        Dear {ticketData.customer_name}, how was your service by {ticketData.technician_name}?
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Click a Star to Rate</label>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`text-4xl transition-all duration-200 transform scale-110 active:scale-125 ${rating >= star ? 'text-yellow-400 drop-shadow-md' : 'text-gray-200'
                                    }`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="mt-3 text-sm font-bold text-blue-600 animate-bounce">
                            {rating === 5 ? 'Excellent! 😍' : rating >= 4 ? 'Good! 😊' : rating >= 3 ? 'Average 😐' : rating >= 2 ? 'Poor ☹️' : 'Very Poor 😡'}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Optional Comments</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us what we did well or how we can improve..."
                        className="w-full border-2 border-gray-50 rounded-2xl p-4 min-h-[120px] focus:border-blue-400 focus:outline-none transition-all placeholder-gray-300 bg-gray-50/50"
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-lg tracking-wide disabled:opacity-50"
                >
                    {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
                </button>
            </form>

            <div className="mt-8 text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                Trusted Service by {BRANDING?.companyName}
            </div>
        </div>
    );
};

export default FeedbackForm;
