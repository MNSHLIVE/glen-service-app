
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TicketStatus } from '../types';

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const AddMockFeedback: React.FC<{ ticketId: string }> = ({ ticketId }) => {
    const { addFeedback } = useAppContext();
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        addFeedback({
            id: `FB-${Date.now()}`,
            ticketId,
            rating,
            comment,
            createdAt: new Date(),
        });
        setShowForm(false);
    }

    if (!showForm) {
        return <button onClick={() => setShowForm(true)} className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300">Add Mock Feedback</button>
    }
    
    return (
        <div className="mt-2 p-2 border rounded bg-gray-50 text-xs">
            <div className="flex items-center space-x-1 mb-2">
                {[1,2,3,4,5].map(r => <button key={r} onClick={() => setRating(r)}><StarIcon filled={r <= rating}/></button>)}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment..." className="w-full border rounded p-1 mb-2 text-xs"></textarea>
            <button onClick={handleSubmit} className="bg-glen-blue text-white px-3 py-1 rounded text-xs">Submit</button>
        </div>
    )
}

const TechnicianRatings: React.FC = () => {
    const { feedback, tickets, technicians } = useAppContext();

    if (feedback.length === 0) {
        return (
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Technician Ratings</h3>
                <p className="text-center text-gray-500 py-8">No feedback has been received yet.</p>
                
                <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold text-gray-700">Add Mock Feedback to a Completed Job:</h4>
                    {tickets.filter(t => t.status === TicketStatus.Completed).slice(0, 3).map(ticket => (
                        <div key={ticket.id} className="mt-2 p-2 border rounded-md text-sm">
                           <p><strong>Ticket:</strong> {ticket.id} ({ticket.customerName})</p>
                           <AddMockFeedback ticketId={ticket.id}/>
                        </div>
                    ))}
                     {tickets.filter(t => t.status === TicketStatus.Completed).length === 0 && <p className="text-xs text-gray-500 mt-2">No jobs are completed yet.</p>}
                </div>
            </div>
        )
    }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Technician Ratings</h3>
      <div className="space-y-6">
        {feedback.map(fb => {
            const ticket = tickets.find(t => t.id === fb.ticketId);
            if (!ticket) return null;
            const technician = technicians.find(t => t.id === ticket.technicianId);

            return (
                <div key={fb.id} className="border-b pb-4">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-700">{technician?.name || 'Unknown'}</p>
                        <div className="flex">
                            {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < fb.rating} />)}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">For Ticket: {ticket.id} ({ticket.customerName})</p>
                    {fb.comment && <p className="mt-2 text-sm bg-gray-100 p-2 rounded-md">"{fb.comment}"</p>}
                    <p className="text-right text-xs text-gray-400 mt-1">{new Date(fb.createdAt).toLocaleDateString()}</p>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default TechnicianRatings;
   