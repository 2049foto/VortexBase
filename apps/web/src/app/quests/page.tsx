'use client';

import { Flame, Gift, Clock, Check, RefreshCw, Loader2 } from 'lucide-react';
import { Navbar, AuthGuard, CardSkeleton } from '@/components';
import { useQuests } from '@/hooks';
import { cn } from '@/lib/utils';

export default function QuestsPage() {
  return (
    <AuthGuard>
      <QuestsContent />
    </AuthGuard>
  );
}

function QuestsContent() {
  const { dailyQuests, weeklyQuests, isLoading, claimQuest, isClaiming, refresh } = useQuests();

  // Mock streak for now
  const streak = 5;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-vortex-bg pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Quests</h1>
            
            {/* Streak Counter */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-vortex-warning/10 border border-vortex-warning/30">
              <Flame size={24} className="text-vortex-warning" />
              <span className="text-xl font-bold text-vortex-warning">{streak}</span>
              <span className="text-sm text-vortex-text-muted">day streak</span>
            </div>
          </div>

          {/* Daily Quests */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock size={20} className="text-vortex-primary" />
                Daily Quests
              </h2>
              <span className="text-sm text-vortex-text-muted">
                Resets at 00:00 UTC
              </span>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              ) : dailyQuests.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-vortex-text-muted">No daily quests available</p>
                </div>
              ) : (
                dailyQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onClaim={() => claimQuest(quest.id)}
                    isClaiming={isClaiming}
                  />
                ))
              )}
            </div>
          </section>

          {/* Weekly Challenges */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Gift size={20} className="text-vortex-secondary" />
                Weekly Challenges
              </h2>
              <span className="text-sm text-vortex-text-muted">
                Resets Monday 00:00 UTC
              </span>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
              ) : weeklyQuests.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-vortex-text-muted">No weekly challenges available</p>
                </div>
              ) : (
                weeklyQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onClaim={() => claimQuest(quest.id)}
                    isClaiming={isClaiming}
                  />
                ))
              )}
            </div>
          </section>

          {/* Refresh Button */}
          <div className="text-center">
            <button onClick={refresh} className="btn-secondary">
              <RefreshCw size={16} className="mr-2" />
              Refresh Quests
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    rewardXp: number;
    completed: boolean;
    claimed: boolean;
    condition: { target: number };
  };
  onClaim: () => void;
  isClaiming: boolean;
}

function QuestCard({ quest, onClaim, isClaiming }: QuestCardProps) {
  const canClaim = quest.completed && !quest.claimed;

  return (
    <div
      className={cn(
        'card flex items-center justify-between gap-4',
        quest.claimed && 'opacity-60'
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          {quest.claimed ? (
            <Check size={18} className="text-vortex-success" />
          ) : quest.completed ? (
            <Gift size={18} className="text-vortex-warning animate-pulse" />
          ) : (
            <Clock size={18} className="text-vortex-text-muted" />
          )}
          <h3 className="font-semibold">{quest.title}</h3>
        </div>
        <p className="text-sm text-vortex-text-muted">{quest.description}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-vortex-primary font-medium whitespace-nowrap">
          +{quest.rewardXp} XP
        </span>

        {quest.claimed ? (
          <span className="px-4 py-2 rounded-lg bg-vortex-success/20 text-vortex-success text-sm font-medium">
            Claimed
          </span>
        ) : canClaim ? (
          <button
            onClick={onClaim}
            disabled={isClaiming}
            className="btn-primary flex items-center gap-2"
          >
            {isClaiming ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Gift size={16} />
            )}
            Claim
          </button>
        ) : (
          <span className="px-4 py-2 rounded-lg bg-vortex-bg text-vortex-text-muted text-sm">
            In Progress
          </span>
        )}
      </div>
    </div>
  );
}
