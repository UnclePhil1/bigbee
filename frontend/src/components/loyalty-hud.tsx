import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Gift, Trophy, Zap } from 'lucide-react';
import { LOYALTY_CONFIG, type LoyaltyUser, type Voucher } from '@/lib/verxioLoyaltyService';

interface LoyaltyHUDProps {
  user: LoyaltyUser;
  onRedeemVoucher?: (voucher: Voucher) => void;
  onViewRewards?: () => void;
}

export function LoyaltyHUD({ user, onRedeemVoucher, onViewRewards }: LoyaltyHUDProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Safety check
  if (!user || !user.currentTier) {
    return null;
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case "Honey Bee": return <Star className="w-4 h-4" />;
      case "Worker Bee": return <Zap className="w-4 h-4" />;
      case "Queen Bee": return <Crown className="w-4 h-4" />;
      case "Royal Bee": return <Trophy className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };



  const getNextTier = (currentTier: string) => {
    const currentIndex = LOYALTY_CONFIG.tiers.findIndex(t => t.name === currentTier);
    if (currentIndex < LOYALTY_CONFIG.tiers.length - 1) {
      return LOYALTY_CONFIG.tiers[currentIndex + 1];
    }
    return null;
  };

  const getTierProgress = () => {
    const currentTier = LOYALTY_CONFIG.tiers.find(t => t.name === user.currentTier);
    const nextTier = getNextTier(user.currentTier);
    
    if (!currentTier || !nextTier) {
      return { progress: 100, xpNeeded: 0 };
    }

    const xpInCurrentTier = user.totalXP - currentTier.xpRequired;
    const xpNeededForNextTier = nextTier.xpRequired - currentTier.xpRequired;
    const progress = (xpInCurrentTier / xpNeededForNextTier) * 100;

    return {
      progress: Math.min(100, Math.max(0, progress)),
      xpNeeded: nextTier.xpRequired - user.totalXP
    };
  };

  const { progress, xpNeeded } = getTierProgress();
  const nextTier = getNextTier(user.currentTier);
  const currentTierData = LOYALTY_CONFIG.tiers.find(t => t.name === user.currentTier);

  return (
    <div className="absolute top-2 right-2 z-20">
      <Card className="w-80 bg-black bg-opacity-90 border-yellow-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white font-['Press_Start_2P'] flex items-center gap-2">
              {getTierIcon(user.currentTier)}
              {user.currentTier}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-white hover:text-yellow-400"
            >
              {showDetails ? '−' : '+'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Tier Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span>XP: {user.totalXP}</span>
              {nextTier && <span>Next: {nextTier.name}</span>}
            </div>
            <Progress value={progress} className="h-2 bg-gray-700" />
            {nextTier && xpNeeded > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {xpNeeded} XP needed for {nextTier.name}
              </p>
            )}
          </div>

          {/* Streak Info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white">Streak: {user.currentStreak} days</span>
            </div>
            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
              {currentTierData?.rewards[0]}
            </Badge>
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div className="space-y-3 border-t border-gray-700 pt-3">
              {/* Current Tier Benefits */}
              <div>
                <h4 className="text-xs font-bold text-yellow-400 mb-2">Current Benefits:</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  {currentTierData?.rewards.map((reward, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Gift className="w-3 h-3 text-green-400" />
                      {reward}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Active Vouchers */}
              {user.vouchers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 mb-2">Active Vouchers:</h4>
                  <div className="space-y-2">
                    {user.vouchers.filter(v => !v.isRedeemed).slice(0, 3).map((voucher) => (
                      <div key={voucher.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                        <div>
                          <p className="text-xs text-white font-bold">{voucher.type.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-xs text-gray-400">+{voucher.value}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onRedeemVoucher?.(voucher)}
                          className="text-xs bg-green-600 hover:bg-green-700"
                        >
                          Redeem
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Tier Preview */}
              {nextTier && (
                <div>
                  <h4 className="text-xs font-bold text-blue-400 mb-2">Next Tier: {nextTier.name}</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {nextTier.rewards.map((reward, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Crown className="w-3 h-3 text-blue-400" />
                        {reward}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* View All Rewards Button */}
              <Button
                onClick={onViewRewards}
                className="w-full text-xs bg-yellow-600 hover:bg-yellow-700"
              >
                View All Rewards
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
