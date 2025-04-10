#[starknet::contract]
mod BalanceNotifier {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;

    #[storage]
    struct Storage {
        // Maps user address to last notification timestamp
        last_notification: LegacyMap<ContractAddress, u64>,
        // Oracle address that provides USD balances
        oracle_address: ContractAddress
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        LowBalanceNotification: LowBalanceNotificationEvent,
    }

    #[derive(Drop, starknet::Event)]
    struct LowBalanceNotificationEvent {
        user: ContractAddress,
        current_balance: u256,
        required_threshold: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState, oracle: ContractAddress) {
        self.oracle_address.write(oracle);
    }

    #[external(v0)]
    fn check_balance(self: ref ContractState, user: ContractAddress) {
        // Constants
        let threshold = 1000 * 10^18; // 1000 USD (18 decimals)
        let cooldown = 86400; // 24 hours in seconds

        // 1. Get balance from oracle (mock implementation)
        let balance = self.get_usd_balance(user);

        // 2. Check balance threshold
        if balance <= threshold {
            // 3. Check notification cooldown
            let last_notified = self.last_notification.read(user);
            let current_time = get_block_timestamp();

            if last_notified == 0 || current_time - last_notified >= cooldown {
                // 4. Emit notification
                self.emit(LowBalanceNotificationEvent { 
                    user, 
                    current_balance: balance, 
                    required_threshold: threshold 
                });

                // 5. Update last notified time
                self.last_notification.write(user, current_time);
            }
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn get_usd_balance(self: @ContractState, user: ContractAddress) -> u256 {
            // In production, this would call an oracle contract
            // Mock implementation returns a dummy value
            500 * 10^18 // Mock 500 USD balance
        }
    }
}