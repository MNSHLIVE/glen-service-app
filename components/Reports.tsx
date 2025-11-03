
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';
import ServiceUpdate from './UpdateJobModal'; // Repurposed as ServiceUpdate component

interface TicketDetailsProps {
    ticketId: string;
    onBack: () => void;
}

type DetailsTab = 'DETAILS' | 'SERVICE_UPDATE';

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticketId, onBack }) => {
    const { tickets, technicians, user } = useAppContext();
    const [activeTab, setActiveTab] = useState<DetailsTab>('DETAILS');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
        return (
            <div>
                <button onClick={onBack} className="text-glen-blue mb-4">&larr; Back to list</button>
                <p>Ticket not found.</p>
            </div>
        )
    }

    const handleGeneratePdf = () => {
        setIsGeneratingPdf(true);
        const technician = technicians.find(t => t.id === ticket.technicianId);

        // 1. Structure the data for the PDF service
        const payload = {
            templateId: 'glen-service-report-template', // Example ID for a template on Apitemplate.io
            data: {
                ...ticket,
                createdAt: new Date(ticket.createdAt).toLocaleString(),
                serviceBookingDate: new Date(ticket.serviceBookingDate).toLocaleDateString(),
                completedAt: ticket.completedAt ? new Date(ticket.completedAt).toLocaleString() : 'N/A',
                purchaseDate: ticket.purchaseDate ? new Date(ticket.purchaseDate).toLocaleDateString() : 'N/A',
                technicianName: technician?.name || 'Unassigned',
            }
        };

        // 2. Simulate the API call
        console.log('[AUTOMATION] Generating PDF with payload:', JSON.stringify(payload, null, 2));
        console.log('[AUTOMATION] Sending data to PDF generation service (e.g., Apitemplate.io)...');

        setTimeout(() => {
            setIsGeneratingPdf(false);
            alert("PDF has been generated and sent to the customer's contact number via WhatsApp.");
        }, 1500);
    }

    const tabClasses = (tab: DetailsTab) => 
        `px-4 py-2 font-semibold text-sm rounded-t-lg ${
            activeTab === tab ? 'border-b-2 border-glen-blue text-glen-blue' : 'text-gray-500'
        }`;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-glen-blue hover:underline">&larr; Back to list</button>
                <div className="space-x-2">
                    <button className="bg-yellow-400 text-white font-bold py-2 px-4 rounded-lg text-sm">Edit</button>
                    <button 
                        onClick={handleGeneratePdf}
                        disabled={isGeneratingPdf}
                        className="bg-glen-red text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-gray-400"
                    >
                        {isGeneratingPdf ? 'Generating...' : 'PDF'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-gray-800">Ticket Details: {ticket.id}</h3>
                <p className="text-sm text-gray-500">{ticket.customerName} - {ticket.address}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 px-4">
                        <button onClick={() => setActiveTab('DETAILS')} className={tabClasses('DETAILS')}>DETAILS</button>
                        <button onClick={() => setActiveTab('SERVICE_UPDATE')} className={tabClasses('SERVICE_UPDATE')}>SERVICE UPDATE</button>
                    </nav>
                </div>

                <div className="p-4">
                    {activeTab === 'DETAILS' && <DetailsTabContent ticket={ticket} />}
                    {activeTab === 'SERVICE_UPDATE' && user?.role === UserRole.Technician && <ServiceUpdate ticket={ticket} onUpdate={onBack} />}
                     {activeTab === 'SERVICE_UPDATE' && user?.role === UserRole.Admin && <p className="text-gray-500 text-sm">Technicians update service details here.</p>}
                </div>
            </div>
        </div>
    )
};

const DetailsTabContent: React.FC<{ ticket: any }> = ({ ticket }) => (
    <div className="space-y-4">
        <DetailItem label="Ticket No" value={ticket.id} />
        <DetailItem label="Make" value={ticket.productDetails.make} />
        <DetailItem label="Segment" value={ticket.productDetails.segment} />
        <DetailItem label="Category" value={ticket.productDetails.category} />
        <DetailItem label="Sub-Category" value={ticket.productDetails.subCategory} />
        <DetailItem label="Product" value={ticket.productDetails.product} />
        
        <div>
            <label className="block text-sm font-medium text-gray-500">Ticket Symptoms</label>
            <div className="mt-1">
                {ticket.symptoms.map((symptom: string) => (
                    <span key={symptom} className="inline-block bg-glen-light-blue text-glen-blue text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                        {symptom}
                    </span>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Serial No.</label>
                <input type="text" value={ticket.serialNo || ''} readOnly className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                <input type="date" value={ticket.purchaseDate ? new Date(ticket.purchaseDate).toISOString().split('T')[0] : ''} readOnly className="mt-1 block w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
        </div>
        
        <div className="flex justify-end pt-2">
             <button className="bg-glen-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">Update</button>
        </div>
    </div>
);

const DetailItem: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
    </div>
);


export default TicketDetails;