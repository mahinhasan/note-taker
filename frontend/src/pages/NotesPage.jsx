import { useAuth } from '../context/AuthContext';
import NotesList from '../components/NotesList';
import { PageHeader } from '../components/ui';

export default function NotesPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <main className="container">
      <PageHeader
        eyebrow="Your Workspace"
        title="Notes"
        description={
          isAdmin
            ? 'Your notes alongside everyone else’s. Filter by owner to focus.'
            : 'Capture tasks, reminders and anything worth keeping. Private to you.'
        }
      />
      <NotesList allowCreate showOwnerFilter={isAdmin} />
    </main>
  );
}
