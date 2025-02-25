// import { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { Button, Modal, Form } from 'react-bootstrap';
// import { getEvents, Event as CalendarEvent } from '../services/fakeApi';
//
// const CalendarView: React.FC = () => {
//     const { calendarId } = useParams<{ calendarId: string }>();
//     const [events, setEvents] = useState<CalendarEvent[]>([]);
//     const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [sortKey, setSortKey] = useState<'date' | 'group' | 'alphabetical'>('date');
//     const [showModal, setShowModal] = useState(false);
//     const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
//     const [isCreating, setIsCreating] = useState<boolean>(false);
//     const [groupName, setGroupName] = useState('');
//     const [groupFilter, setGroupFilter] = useState('Tous');
//     const [groups, setGroups] = useState<string[]>([]);
//     const [selectedGroup, setSelectedGroup] = useState<string>('');
//     const [newGroupName, setNewGroupName] = useState<string>('');
//
//     useEffect(() => {
//         if (calendarId) {
//             getEvents(calendarId)
//                 .then(data => {
//                     setEvents(data);
//                     setLoading(false);
//                     const existingGroups = Array.from(new Set(data.map(ev => ev.group).filter(Boolean) as string[]));
//                     setGroups(existingGroups);
//                 })
//                 .catch(err => {
//                     setError('Erreur lors du chargement des événements');
//                     setLoading(false);
//                 });
//         }
//     }, [calendarId]);
//
//     // Filtrage des événements par groupe sélectionné
//     const filteredEvents = events.filter(ev => {
//         if (groupFilter === 'Tous') return true;
//         return ev.group === groupFilter;
//     });
//
//     const toggleSelectEvent = (eventId: string) => {
//         setSelectedEventIds(prev =>
//             prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
//         );
//     };
//
//     // Trie les événements filtrés
//     const sortedEvents = () => {
//         let sorted = [...filteredEvents];
//         if (sortKey === 'date') {
//             sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
//         } else if (sortKey === 'alphabetical') {
//             sorted.sort((a, b) => a.title.localeCompare(b.title));
//         } else if (sortKey === 'group') {
//             sorted.sort((a, b) => (a.group || '').localeCompare(b.group || ''));
//         }
//         return sorted;
//     };
//
//     // Ouvre le modal en mode édition
//     const handleEditEvent = (event: CalendarEvent) => {
//         setCurrentEvent(event);
//         setSelectedGroup(event.group || "");
//         setNewGroupName("");
//         setIsCreating(false);
//         setShowModal(true);
//     };
//
//     // Ouvre le modal en mode création
//     const handleCreateEvent = () => {
//         const today = new Date().toISOString().split('T')[0];
//         const newEvent: CalendarEvent = {
//             id: Date.now().toString(),
//             title: '',
//             date: today,
//             group: ''
//         };
//         setCurrentEvent(newEvent);
//         setSelectedGroup('');
//         setNewGroupName('');
//         setIsCreating(true);
//         setShowModal(true);
//     };
//
//     // Sauvegarde des modifications ou création d'un nouvel événement
//     const saveEventChanges = () => {
//         if (currentEvent) {
//             let updatedGroup = currentEvent.group;
//             if (selectedGroup === "new") {
//                 if (newGroupName.trim() !== "") {
//                     updatedGroup = newGroupName;
//                     if (!groups.includes(newGroupName)) {
//                         setGroups(prev => [...prev, newGroupName]);
//                     }
//                 }
//             } else {
//                 updatedGroup = selectedGroup;
//             }
//             const updatedEvent = { ...currentEvent, group: updatedGroup };
//
//             if (isCreating) {
//                 // Ajout d'un nouvel événement
//                 setEvents(prev => [...prev, updatedEvent]);
//             } else {
//                 // Mise à jour de l'événement existant
//                 setEvents(prev => prev.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev));
//             }
//             setShowModal(false);
//             setCurrentEvent(null);
//         }
//     };
//
//     const assignGroup = () => {
//         setEvents(prev =>
//             prev.map(ev => selectedEventIds.includes(ev.id) ? { ...ev, group: groupName } : ev)
//         );
//         setSelectedEventIds([]);
//         setGroupName('');
//     };
//
//     if (loading) return <div className="container mt-3">Chargement...</div>;
//     if (error) return <div className="container mt-3 text-danger">{error}</div>;
//
//     return (
//         <div className="container mt-3">
//             <h2>Événements du Calendrier</h2>
//
//             {/* Bouton pour créer un nouvel événement */}
//             <div className="mb-3">
//                 <Button variant="success" onClick={handleCreateEvent}>
//                     Créer un événement
//                 </Button>
//             </div>
//
//             <div className="mb-3">
//                 <Form.Select value={sortKey} onChange={(e) => setSortKey(e.target.value as 'date' | 'group' | 'alphabetical')}>
//                     <option value="date">Trier par date</option>
//                     <option value="alphabetical">Trier par ordre alphabétique</option>
//                 </Form.Select>
//             </div>
//             <div className="mb-3">
//                 <Form.Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
//                     <option value="Tous">Tous les groupes</option>
//                     {groups.map((grp, index) => (
//                         <option key={index} value={grp}>{grp}</option>
//                     ))}
//                 </Form.Select>
//             </div>
//             <div className="mb-3">
//                 <Form.Control
//                     type="text"
//                     placeholder="Nom du groupe"
//                     value={groupName}
//                     onChange={(e) => setGroupName(e.target.value)}
//                     className="mb-2"
//                 />
//                 <Button variant="primary" onClick={assignGroup} disabled={selectedEventIds.length === 0 || groupName.trim() === ''}>
//                     Assigner le groupe aux événements sélectionnés
//                 </Button>
//             </div>
//             <table className="table table-striped">
//                 <thead>
//                 <tr>
//                     <th>Sélection</th>
//                     <th>Titre</th>
//                     <th>Date</th>
//                     <th>Groupe</th>
//                     <th>Actions</th>
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {sortedEvents().map(ev => (
//                     <tr key={ev.id}>
//                         <td>
//                             <Form.Check
//                                 type="checkbox"
//                                 checked={selectedEventIds.includes(ev.id)}
//                                 onChange={() => toggleSelectEvent(ev.id)}
//                             />
//                         </td>
//                         <td>{ev.title}</td>
//                         <td>{new Date(ev.date).toLocaleDateString()}</td>
//                         <td>{ev.group || '-'}</td>
//                         <td>
//                             <Button variant="warning" size="sm" onClick={() => handleEditEvent(ev)}>
//                                 Modifier
//                             </Button>
//                         </td>
//                     </tr>
//                 ))}
//                 </tbody>
//             </table>
//
//             <Modal show={showModal} onHide={() => setShowModal(false)}>
//                 <Modal.Header closeButton>
//                     <Modal.Title>{isCreating ? "Créer un événement" : "Modifier l'événement"}</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {currentEvent && (
//                         <Form>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Titre</Form.Label>
//                                 <Form.Control
//                                     type="text"
//                                     value={currentEvent.title}
//                                     onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
//                                 />
//                             </Form.Group>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Date</Form.Label>
//                                 <Form.Control
//                                     type="date"
//                                     value={currentEvent.date.split('T')[0]}
//                                     onChange={(e) => setCurrentEvent({ ...currentEvent, date: e.target.value })}
//                                 />
//                             </Form.Group>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Groupe</Form.Label>
//                                 <Form.Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
//                                     <option value="">Aucun</option>
//                                     {groups.map((grp, index) => (
//                                         <option key={index} value={grp}>{grp}</option>
//                                     ))}
//                                     <option value="new">Créer un nouveau groupe</option>
//                                 </Form.Select>
//                             </Form.Group>
//                             {selectedGroup === "new" && (
//                                 <Form.Group className="mb-3">
//                                     <Form.Label>Nouveau groupe</Form.Label>
//                                     <Form.Control
//                                         type="text"
//                                         value={newGroupName}
//                                         onChange={(e) => setNewGroupName(e.target.value)}
//                                         placeholder="Entrez le nom du nouveau groupe"
//                                     />
//                                 </Form.Group>
//                             )}
//                         </Form>
//                     )}
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowModal(false)}>
//                         Annuler
//                     </Button>
//                     <Button variant="primary" onClick={saveEventChanges}>
//                         Sauvegarder
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
//         </div>
//     );
// };
//
// export default CalendarView;