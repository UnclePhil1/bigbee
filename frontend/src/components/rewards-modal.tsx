import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Star, Gift, Trophy, Zap, CheckCircle, XCircle } from 'lucide-react';
import { LOYALTY_CONFIG, type LoyaltyUser, type Voucher } from '@/lib/verxioLoyaltyService';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: LoyaltyUser;
  onRedeemVoucher?: (voucher: Voucher) => void;
}

export function RewardsModal({ isOpen, onClose, user, onRedeemVoucher }: RewardsModalProps) {
  const [activeTab, setActiveTab] = useState('vouchers');

  // Safety check
  if (!user || !user.currentTier) {
    return null;
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case "Honey Bee": return <Star className="w-5 h-5" />;
      case "Worker Bee": return <Zap className="w-5 h-5" />;
      case "Queen Bee": return <Crown className="w-5 h-5" />;
      case "Royal Bee": return <Trophy className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };



  const getVoucherIcon = (type: Voucher['type']) => {
    switch (type) {
      case 'honey_boost': return <Gift className="w-4 h-4" />;
      case 'xp_boost': return <Zap className="w-4 h-4" />;
      case 'skin_unlock': return <Crown className="w-4 h-4" />;
      case 'mission_unlock': return <Trophy className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const formatVoucherType = (type: Voucher['type']) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isVoucherExpired = (voucher: Voucher) => {
    return new Date(voucher.expiresAt) < new Date();
  };

  const activeVouchers = user.vouchers.filter(v => !v.isRedeemed && !isVoucherExpired(v));
  const expiredVouchers = user.vouchers.filter(v => !v.isRedeemed && isVoucherExpired(v));
  const redeemedVouchers = user.vouchers.filter(v => v.isRedeemed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-black bg-opacity-95 border-yellow-500">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white font-['Press_Start_2P'] text-center">
            🏆 CrossRoad Rewards Center
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="vouchers" className="text-white">Vouchers</TabsTrigger>
            <TabsTrigger value="tiers" className="text-white">Tiers</TabsTrigger>
            <TabsTrigger value="progress" className="text-white">Progress</TabsTrigger>
            <TabsTrigger value="history" className="text-white">History</TabsTrigger>
          </TabsList>

          {/* Vouchers Tab */}
          <TabsContent value="vouchers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Active Vouchers */}
              <Card className="bg-gray-900 border-green-500">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Active Vouchers ({activeVouchers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeVouchers.length > 0 ? (
                    activeVouchers.map((voucher) => (
                      <div key={voucher.id} className="bg-gray-800 p-3 rounded border border-green-500">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getVoucherIcon(voucher.type)}
                            <span className="font-bold text-white">{formatVoucherType(voucher.type)}</span>
                          </div>
                          <Badge className="bg-green-600">+{voucher.value}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Expires: {new Date(voucher.expiresAt).toLocaleDateString()}</span>
                          <Button
                            size="sm"
                            onClick={() => onRedeemVoucher?.(voucher)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Redeem
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No active vouchers</p>
                  )}
                </CardContent>
              </Card>

              {/* Expired Vouchers */}
              <Card className="bg-gray-900 border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Expired Vouchers ({expiredVouchers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {expiredVouchers.length > 0 ? (
                    expiredVouchers.map((voucher) => (
                      <div key={voucher.id} className="bg-gray-800 p-3 rounded border border-red-500 opacity-60">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getVoucherIcon(voucher.type)}
                            <span className="font-bold text-white">{formatVoucherType(voucher.type)}</span>
                          </div>
                          <Badge className="bg-red-600">+{voucher.value}</Badge>
                        </div>
                        <div className="text-sm text-red-400">
                          Expired: {new Date(voucher.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No expired vouchers</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value="tiers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LOYALTY_CONFIG.tiers.map((tier) => {
                const isCurrentTier = tier.name === user.currentTier;
                const isUnlocked = user.totalXP >= tier.xpRequired;
                
                return (
                  <Card 
                    key={tier.name} 
                    className={`bg-gray-900 ${
                      isCurrentTier 
                        ? 'border-yellow-500 bg-yellow-500 bg-opacity-10' 
                        : isUnlocked 
                          ? 'border-green-500' 
                          : 'border-gray-600 opacity-60'
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${
                        isCurrentTier ? 'text-yellow-400' : isUnlocked ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {getTierIcon(tier.name)}
                        {tier.name}
                        {isCurrentTier && <Badge className="bg-yellow-600">Current</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">XP Required:</span>
                          <span className="text-white">{tier.xpRequired}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-300 mb-2">Rewards:</h4>
                          <ul className="space-y-1">
                            {tier.rewards.map((reward, rewardIndex) => (
                              <li key={rewardIndex} className="text-sm text-gray-400 flex items-center gap-2">
                                <Gift className="w-3 h-3 text-green-400" />
                                {reward}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card className="bg-gray-900 border-blue-500">
              <CardHeader>
                <CardTitle className="text-blue-400">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{user.totalXP}</div>
                    <div className="text-sm text-gray-400">Total XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{user.currentStreak}</div>
                    <div className="text-sm text-gray-400">Day Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{user.vouchers.length}</div>
                    <div className="text-sm text-gray-400">Total Vouchers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {user.vouchers.filter(v => !v.isRedeemed).length}
                    </div>
                    <div className="text-sm text-gray-400">Active Vouchers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-gray-900 border-purple-500">
              <CardHeader>
                <CardTitle className="text-purple-400">Redeemed Vouchers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {redeemedVouchers.length > 0 ? (
                  redeemedVouchers.map((voucher) => (
                    <div key={voucher.id} className="bg-gray-800 p-3 rounded border border-purple-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getVoucherIcon(voucher.type)}
                          <span className="font-bold text-white">{formatVoucherType(voucher.type)}</span>
                        </div>
                        <Badge className="bg-purple-600">Redeemed</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No redeemed vouchers yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
