import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Checkbox from '../components/Checkbox';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, FileTextIcon, AlertTriangleIcon, AwardIcon, CheckSquareIcon } from '../components/Icons';
import { cn, formatDate } from '../utils';

const MiniCalendarPopover = ({ isOpen, onClose, onSelectDate, targetElement }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !targetElement) return null;

    const popoverWidth = 288; // w-72
    const popoverRect = targetElement.getBoundingClientRect();
    
    const leftPosition = popoverRect.right + window.scrollX - popoverWidth;
    const topPosition = popoverRect.bottom + window.scrollY + 5;

    const style = {
        position: 'absolute',
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
        zIndex: 100,
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDay = firstDayOfMonth.getDay();

    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    return createPortal(
        <div ref={popoverRef} style={style}>
            <GlassPanel className="p-4 w-72">
                <div className="flex justify-between items-center mb-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)}><ChevronLeftIcon /></Button>
                    <span className="font-semibold text-sm capitalize text-gray-900 dark:text-white">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)}><ChevronRightIcon /></Button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-300">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="w-8 h-8 flex items-center justify-center">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const isToday = date.toDateString() === new Date().toDateString();
                        return (
                            <button
                                key={day}
                                onClick={() => onSelectDate(date)}
                                className={cn(
                                    "w-8 h-8 rounded-full hover:bg-cyan-500/20 text-gray-800 dark:text-gray-200",
                                    isToday && "ring-2 ring-cyan-500"
                                )}
                            >
                                {day}
                            </button>
                        )
                    })}
                </div>
            </GlassPanel>
        </div>,
        document.body
    );
};

function CalendarPage({ onNavigate }) {
    const { users, completedEvents, toggleEventCompletion, updateClient, actionableEvents } = useData();
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [popoverState, setPopoverState] = useState({ isOpen: false, event: null, target: null });

    const allEvents = actionableEvents;

    const completedEventIds = useMemo(() => new Set((completedEvents || []).map(e => e.eventId)), [completedEvents]);

    const eventsByDay = useMemo(() => {
        const eventsMap = {};
        if (allEvents) {
            allEvents.forEach(event => {
                const dayKey = event.date.toISOString().split('T')[0];
                if (!eventsMap[dayKey]) eventsMap[dayKey] = [];
                eventsMap[dayKey].push(event);
            });
        }
        return eventsMap;
    }, [allEvents]);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1));
    const startingDay = firstDayOfMonth.getDay();
    const changeMonth = (offset) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    const todayKey = new Date().toISOString().split('T')[0];

    const handlePostponeDateSelect = async (newDate) => {
        const { event } = popoverState;
        if (!event) return;

        const { client, originalDate } = event.data;
        const newDateForEvent = newDate.toISOString().split('T')[0];
        const exceptions = client.boletoExceptions || [];
        const existingIndex = exceptions.findIndex(ex => ex.originalDate === originalDate);

        if (existingIndex > -1) {
            exceptions[existingIndex].modifiedDate = newDateForEvent;
        } else {
            exceptions.push({ originalDate: originalDate, modifiedDate: newDateForEvent });
        }

        const success = await updateClient(client.id, { ...client, boletoExceptions: exceptions });
        if (success) {
            toast({ title: 'Adiado!', description: `O envio do boleto foi adiado para ${newDate.toLocaleDateString('pt-BR')}.` });
        } else {
            toast({ title: 'Erro', description: 'Não foi possível adiar o evento.', variant: 'destructive' });
        }
        setPopoverState({ isOpen: false, event: null, target: null });
    };

    const DayAgenda = () => {
        const dayKey = selectedDate.toISOString().split('T')[0];
        const dayEvents = (eventsByDay[dayKey] || []).sort((a, b) => a.type.localeCompare(b.type));
        const pendingEvents = dayEvents.filter(e => !completedEventIds.has(e.id));
        const completedEventsToday = dayEvents.filter(e => completedEventIds.has(e.id));

        const getWhatsAppLink = (client) => {
            const phone = client?.general?.contactPhone || client?.general?.phone;
            if (!phone) return null;
            return `https://wa.me/55${phone.replace(/\D/g, '')}`;
        }

        if (dayEvents.length === 0) {
            return (<div className="text-center text-gray-500 pt-16 flex flex-col items-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                <h4 className="font-semibold mt-4">Nenhum evento para este dia.</h4>
                <p className="text-sm">Relaxe ou planeje o futuro!</p>
            </div>);
        }

        return (
            <div className="space-y-4">
                {pendingEvents.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Pendentes</h4>
                        <div className="space-y-3">
                            {pendingEvents.map(event => {
                                const responsible = users.find(u => u.id === event.data?.contract?.boletoResponsibleId || u.id === event.data?.task?.assignedTo);
                                const whatsAppLink = getWhatsAppLink(event.data.client);
                                return (
                                    <GlassPanel key={event.id} className="p-3">
                                        <div className="flex items-start gap-3">
                                            <div className={cn("w-8 h-8 mt-1 rounded-lg flex-shrink-0 flex items-center justify-center text-white", event.color)}>
                                                <event.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{event.title}</p>
                                                <p className="text-xs text-gray-500">Responsável: {responsible?.name || 'Não definido'}</p>
                                            </div>
                                            <Checkbox checked={false} onChange={(e) => toggleEventCompletion(event, e.target.checked)} title="Marcar como concluído" />
                                        </div>
                                        {event.type === 'boletoSend' && (
                                            <div className="flex gap-2 mt-2 pl-11">
                                                <Button size="sm" variant="outline" onClick={() => onNavigate('client-details', event.data.client.id)}>Ver Cliente</Button>
                                                {whatsAppLink && <Button size="sm" as="a" href={whatsAppLink} target="_blank" rel="noopener noreferrer">WhatsApp</Button>}
                                                <Button size="sm" variant="ghost" onClick={(e) => setPopoverState({ isOpen: true, event: event, target: e.currentTarget })}>Adiar</Button>
                                            </div>
                                        )}
                                    </GlassPanel>
                                )
                            })}
                        </div>
                    </div>
                )}
                {completedEventsToday.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-6">Concluídos</h4>
                        <div className="space-y-2">
                            {completedEventsToday.map(event => (
                                <div key={event.id} className="p-2 rounded-lg flex items-center gap-3 opacity-60">
                                    <Checkbox checked={true} onChange={(e) => toggleEventCompletion(event, e.target.checked)} />
                                    <div className={cn("w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-white", event.color)}><event.icon className="w-4 h-4" /></div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 line-through truncate">{event.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-5rem)] flex flex-col">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex-shrink-0">Calendário Inteligente</h2>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <GlassPanel className="p-6 lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeftIcon /></Button>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize w-48 text-center">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}><ChevronRightIcon /></Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="p-2">{day}</div>)}</div>
                    <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-grow">
                        {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} className="border border-transparent"></div>)}
                        {daysInMonth.map(day => {
                            const dayKey = day.toISOString().split('T')[0];
                            const dayEvents = (eventsByDay[dayKey] || []).filter(e => !completedEventIds.has(e.id));
                            const isSelected = day.toDateString() === selectedDate.toDateString();
                            const isToday = dayKey === todayKey;

                            const eventTypeColors = {
                                boletoSend: 'bg-cyan-500',
                                task: 'bg-red-500',
                                renewal: 'bg-violet-500',
                                boletoDue: 'bg-yellow-500',
                            };
                            const eventTypesOnDay = new Set(dayEvents.map(e => e.type));

                            return (
                                <div key={dayKey} onClick={() => setSelectedDate(day)} className={cn("border border-gray-200/50 dark:border-white/10 p-2 hover:bg-cyan-500/10 transition-colors cursor-pointer rounded-lg min-h-[5rem]", isSelected && "ring-2 ring-cyan-500", isToday && "bg-cyan-100/30 dark:bg-cyan-900/20")}>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("font-bold", isToday ? "text-cyan-600 dark:text-cyan-300" : "text-gray-800 dark:text-white")}>{day.getDate()}</span>
                                        {dayEvents.length > 0 &&
                                            <div className="flex items-center gap-1">
                                                {Array.from(eventTypesOnDay).slice(0, 4).map(type => (
                                                    <div key={type} className={cn("w-2.5 h-2.5 rounded-full", eventTypeColors[type] || 'bg-gray-400')}></div>
                                                ))}
                                            </div>
                                        }
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </GlassPanel>
                <GlassPanel className="p-6 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">Agenda do Dia <span className="text-cyan-500">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span></h3>
                    <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                        <DayAgenda />
                    </div>
                </GlassPanel>
            </div>
            <MiniCalendarPopover
                isOpen={popoverState.isOpen}
                onClose={() => setPopoverState({ isOpen: false, event: null, target: null })}
                onSelectDate={handlePostponeDateSelect}
                targetElement={popoverState.target}
            />
        </div>
    );
};

export default CalendarPage;