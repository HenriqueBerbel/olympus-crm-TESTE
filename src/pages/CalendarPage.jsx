import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks e Contextos
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/NotificationContext';
import { cn, formatDate } from '../utils';

// Componentes da UI
import GlassPanel from '../components/GlassPanel';
import Button from '../components/Button';
import Checkbox from '../components/Checkbox';
import EmptyState from '../components/EmptyState';
import { Avatar } from '../components/Avatar';

// Ícones
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, WhatsAppIcon } from '../components/Icons';

// ========================================================================
//          *** VARIANTES DE ANIMAÇÃO ***
// ========================================================================
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

// ========================================================================
//          *** SUBCOMPONENTES REFINADOS ***
// ========================================================================

const MiniCalendarPopover = memo(({ isOpen, onClose, onSelectDate, targetElement }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target) && !targetElement?.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, targetElement]);

    if (!targetElement) return null;

    const popoverRect = targetElement.getBoundingClientRect();
    const style = {
        position: 'absolute',
        top: `${popoverRect.bottom + window.scrollY + 8}px`,
        left: `${popoverRect.left + window.scrollX}px`,
        zIndex: 100,
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDay = firstDayOfMonth.getDay();

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popoverRef}
                    style={style}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <GlassPanel className="p-4 w-72">
                        <div className="flex justify-between items-center mb-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))}><ChevronLeftIcon /></Button>
                            <span className="font-semibold text-sm capitalize text-gray-900 dark:text-white">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))}><ChevronRightIcon /></Button>
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
                                    <button key={day} onClick={() => onSelectDate(date)} className={cn("w-8 h-8 rounded-full hover:bg-cyan-500/20", isToday && "ring-2 ring-cyan-500")}>
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </GlassPanel>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
});

const CalendarView = memo(({ currentDate, selectedDate, eventsByDay, completedEventIds, onDateSelect, onMonthChange }) => {
    const { daysInMonth, startingDay } = useMemo(() => {
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days = Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1));
        return { daysInMonth: days, startingDay: firstDay.getDay() };
    }, [currentDate]);

    const todayKey = new Date().toISOString().split('T')[0];
    const eventTypeColors = { boletoSend: 'bg-cyan-500', task: 'bg-red-500' };

    return (
        <GlassPanel className="p-6 lg:col-span-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onMonthChange(-1)} aria-label="Mês anterior"><ChevronLeftIcon /></Button>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize w-48 text-center">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => onMonthChange(1)} aria-label="Próximo mês"><ChevronRightIcon /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="p-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-grow">
                {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} className="border border-transparent"></div>)}
                {daysInMonth.map((day, index) => {
                    const dayKey = day.toISOString().split('T')[0];
                    const dayEvents = (eventsByDay[dayKey] || []).filter(e => !completedEventIds.has(e.id));
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const isToday = dayKey === todayKey;
                    
                    return (
                        <motion.div
                            key={dayKey}
                            onClick={() => onDateSelect(day)}
                            className={cn( "border border-gray-200/50 dark:border-white/10 p-2 transition-all duration-200 cursor-pointer rounded-lg flex flex-col justify-between", isSelected ? "ring-2 ring-violet-500 bg-violet-500/10" : "hover:bg-violet-500/5", isToday && !isSelected && "bg-cyan-100/30 dark:bg-cyan-900/20" )}
                            variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.02 }} whileHover={{ scale: 1.05, zIndex: 10 }}
                        >
                            <span className={cn("font-bold text-sm self-start", isToday ? "text-violet-600 dark:text-violet-300" : "text-gray-800 dark:text-white")}>
                                {day.getDate()}
                            </span>
                            {dayEvents.length > 0 &&
                                <div className="flex items-center gap-1 self-end">
                                    {Array.from(new Set(dayEvents.map(e => e.type))).slice(0, 3).map(type => (
                                        <div key={type} className={cn("w-2 h-2 rounded-full", eventTypeColors[type] || 'bg-gray-400')}></div>
                                    ))}
                                </div>
                            }
                        </motion.div>
                    );
                })}
            </div>
        </GlassPanel>
    );
});

const DayAgenda = memo(({ selectedDate, events, completedEventIds, users, onToggleCompletion, onPostpone }) => {
    const navigate = useNavigate();
    const getWhatsAppLink = (client) => {
        const phone = client?.general?.contactPhone || client?.general?.phone;
        if (!phone) return null;
        return `https://wa.me/55${phone.replace(/\D/g, '')}`;
    };

    const pendingEvents = (events || []).filter(e => !completedEventIds.has(e.id));
    const completedEventsToday = (events || []).filter(e => completedEventIds.has(e.id));

    return (
        <GlassPanel className="p-6 flex flex-col h-full">
            <motion.h3 key={selectedDate.toString()} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">
                Agenda de <span className="text-violet-500">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
            </motion.h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                <AnimatePresence>
                    {pendingEvents.length > 0 ? (
                        <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Pendentes</h4>
                            <motion.div layout variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible">
                                {pendingEvents.map(event => (
                                    <motion.div key={event.id} layout variants={itemVariants} whileHover={{ y: -3 }}>
                                        <div className="p-3 rounded-lg mb-3 bg-gray-50 dark:bg-black/20">
                                            <div className="flex items-start gap-3">
                                                <div className={cn("w-8 h-8 mt-1 rounded-lg flex-shrink-0 flex items-center justify-center text-white", event.color)}><event.icon className="w-5 h-5" /></div>
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{event.title}</p>
                                                    <p className="text-xs text-gray-500">Responsável: {users.find(u => u.id === (event.data?.contract?.boletoResponsibleId || event.data?.task?.assignedTo))?.name || 'N/A'}</p>
                                                </div>
                                                <Checkbox checked={false} onChange={(e) => onToggleCompletion(event, e.target.checked)} title="Concluir"/>
                                            </div>
                                            {event.type === 'boletoSend' && (
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/10 ml-11">
                                                    <Button size="sm" variant="outline" onClick={() => navigate(`/clients/${event.data.client.id}`)}>Ver Cliente</Button>
                                                    <Button size="sm" as="a" href={getWhatsAppLink(event.data.client)} target="_blank" disabled={!getWhatsAppLink(event.data.client)} className="!bg-emerald-500 hover:!bg-emerald-600 text-white"><WhatsAppIcon className="w-4 h-4 mr-1.5"/> WhatsApp</Button>
                                                    <Button size="sm" variant="ghost" onClick={(e) => onPostpone(event, e.currentTarget)}>Adiar</Button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div key="no-pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-500 pt-16 flex flex-col items-center">
                            <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                            <h4 className="font-semibold mt-4">Nenhum evento pendente.</h4>
                            <p className="text-sm">Dia livre ou tudo em ordem!</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                {completedEventsToday.length > 0 && (
                     <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-6">Concluídos</h4>
                        <div className="space-y-2">
                            {completedEventsToday.map(event => (
                                <div key={event.id} className="p-2 rounded-lg flex items-center gap-3 opacity-60">
                                    <Checkbox checked={true} onChange={(e) => onToggleCompletion(event, e.target.checked)} title="Reabrir"/>
                                    <div className={cn("w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-white", event.color)}><event.icon className="w-4 h-4" /></div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 line-through truncate">{event.title}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </GlassPanel>
    );
});

// --- COMPONENTE PRINCIPAL ---
function CalendarPage() {
    const { users, completedEvents, toggleEventCompletion, updateClient, actionableEvents, loading } = useData();
    const { toast } = useToast();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [popoverState, setPopoverState] = useState({ isOpen: false, event: null, target: null });

    const completedEventIds = useMemo(() => new Set((completedEvents || []).map(e => e.eventId)), [completedEvents]);
    const eventsByDay = useMemo(() => {
        const eventsMap = {};
        (actionableEvents || []).forEach(event => {
            const dayKey = event.date.toISOString().split('T')[0];
            if (!eventsMap[dayKey]) eventsMap[dayKey] = [];
            eventsMap[dayKey].push(event);
        });
        return eventsMap;
    }, [actionableEvents]);

    const handlePostponeDateSelect = async (newDate) => {
        const { event } = popoverState;
        if (!event) return;

        const { client } = event.data;
        const originalEventDate = event.date.toISOString().split('T')[0];
        const newEventDate = newDate.toISOString().split('T')[0];
        const exceptions = client.boletoExceptions || [];
        const existingIndex = exceptions.findIndex(ex => ex.originalDate === originalEventDate);

        if (existingIndex > -1) {
            exceptions[existingIndex].modifiedDate = newEventDate;
        } else {
            exceptions.push({ originalDate: originalEventDate, modifiedDate: newEventDate });
        }

        const success = await updateClient(client.id, { boletoExceptions: exceptions });
        if (success) {
            toast({ title: 'Adiado!', description: `O envio do boleto foi adiado para ${newDate.toLocaleDateString('pt-BR')}.` });
        }
        setPopoverState({ isOpen: false, event: null, target: null });
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col animate-pulse">
                <div className="h-9 w-64 bg-gray-300 dark:bg-gray-700 rounded-md mb-6"></div>
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    <div className="p-6 lg:col-span-2 bg-gray-200 dark:bg-gray-800/50 rounded-2xl"></div>
                    <div className="p-6 bg-gray-200 dark:bg-gray-800/50 rounded-2xl"></div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-5rem)] flex flex-col">
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0 flex justify-between items-center mb-6"
            >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Calendário Inteligente</h2>
                <Button onClick={() => setSelectedDate(new Date())}>Hoje</Button>
            </motion.header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <CalendarView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    eventsByDay={eventsByDay}
                    completedEventIds={completedEventIds}
                    onDateSelect={setSelectedDate}
                    onMonthChange={(offset) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))}
                />
                <DayAgenda 
                    selectedDate={selectedDate}
                    events={eventsByDay[selectedDate.toISOString().split('T')[0]]}
                    completedEventIds={completedEventIds}
                    users={users}
                    onToggleCompletion={toggleEventCompletion}
                    onPostpone={(event, target) => setPopoverState({ isOpen: true, event, target })}
                />
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