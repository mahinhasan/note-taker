import { useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { PageHeader } from '../components/ui';
import UsersAdmin from '../components/UsersAdmin';
import InterestGroups from '../components/InterestGroups';
import NotesList from '../components/NotesList';

const TABS = [
  { id: 'users', label: 'Users', icon: 'users', description: 'Create, edit and remove accounts.' },
  { id: 'interests', label: 'Grouped by interests', icon: 'tag', description: 'See which members share an interest.' },
  { id: 'notes', label: 'All notes', icon: 'notes', description: 'Browse every note across all members.' },
];

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const active = TABS.find((t) => t.id === requested) || TABS[0];

  return (
    <main className="container">
      <PageHeader eyebrow="Administration" title="Admin Console" description={active.description} />

      <div className="tabs" role="tablist" aria-label="Admin sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="tab"
            aria-selected={active.id === tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
          >
            <Icon name={tab.icon} size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={active.label}>
        {active.id === 'users' && <UsersAdmin />}
        {active.id === 'interests' && <InterestGroups />}
        {active.id === 'notes' && <NotesList allowCreate={false} showOwnerFilter />}
      </div>
    </main>
  );
}
