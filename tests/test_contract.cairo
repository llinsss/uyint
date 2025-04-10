use starknet::ContractAddress;

use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};

use uyint::IHelloStarknetSafeDispatcher;
use uyint::IHelloStarknetSafeDispatcherTrait;
use uyint::IHelloStarknetDispatcher;
use uyint::IHelloStarknetDispatcherTrait;

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

#[test]
fn test_increase_balance() {
    let contract_address = deploy_contract("HelloStarknet");

    let dispatcher = IHelloStarknetDispatcher { contract_address };

    let balance_before = dispatcher.get_balance();
    assert(balance_before == 0, 'Invalid balance');

    dispatcher.increase_balance(42);

    let balance_after = dispatcher.get_balance();
    assert(balance_after == 42, 'Invalid balance');
}

#[test]
#[feature("safe_dispatcher")]
fn test_cannot_increase_balance_with_zero_value() {
    let contract_address = deploy_contract("HelloStarknet");

    let safe_dispatcher = IHelloStarknetSafeDispatcher { contract_address };

    let balance_before = safe_dispatcher.get_balance().unwrap();
    assert(balance_before == 0, 'Invalid balance');

    match safe_dispatcher.increase_balance(0) {
        Result::Ok(_) => core::panic_with_felt252('Should have panicked'),
        Result::Err(panic_data) => {
            assert(*panic_data.at(0) == 'Amount cannot be 0', *panic_data.at(0));
        }
    };
}
#[starknet::contract]
mod BalanceNotifier {
    use starknet::storage::{StorageMapReadAccess, StorageMapWriteAccess};
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

    fn check_balance(mut self: ContractState, user: ContractAddress) {
        // Constants
        let threshold = 1000 * 10^18; // 1000 USD (18 decimals)
        let cooldown = 86400; // 24 hours in seconds

        // 1. Get balance from oracle (mock implementation)
        let balance = self.get_usd_balance(user);

        // 2. Check balance threshold
        if balance <= threshold {
            let last_notified = self.last_notification.read(user);
            let last_notified = self.last_notification.read(user);
            let last_notified = self.last_notification.read(user).unwrap_or(0);

            let current_time = get_block_timestamp();
            if last_notified == 0 || current_time - last_notified >= cooldown {
                // 4. Emit notification
                self.emit(LowBalanceNotificationEvent { 
                    user, 
                    current_balance: balance, 
                    required_threshold: threshold 
                });

                self.last_notification.write(user, current_time).unwrap();
                self.last_notification.write(user, current_time);
                    self.last_notification.write(user, current_time).unwrap();
                }
            }
        }
    #[starknet::interface]
    trait InternalTrait {
        fn get_usd_balance(self: @ContractState, user: ContractAddress) -> u256;
    }

    impl InternalImpl of InternalTrait {
        fn get_usd_balance(self: @ContractState, user: ContractAddress) -> u256 {
            // In production, this would call an oracle contract
            // Mock implementation returns a dummy value
            500 * 10^18 // Mock 500 USD balance
        }
    }
   }
