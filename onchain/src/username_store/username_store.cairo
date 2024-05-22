pub mod UserNameClaimErrors {
    pub const USERNAME_CLAIMED: felt252 = 'Username already claimed';
    pub const USER_HAS_USERNAME: felt252 = 'User already has a username';
    pub const USER_DOESNT_HAVE_USERNAME: felt252 = 'User does not have a username';
}

#[starknet::contract]
pub mod UsernameStore {
    use art_peace::username_store::IUsernameStore;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};
    use super::UserNameClaimErrors;

    #[storage]
    struct Storage {
        usernames: LegacyMap::<felt252, ContractAddress>,
        user_to_username: LegacyMap::<ContractAddress, felt252>
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        UserNameClaimed: UserNameClaimed,
        UserNameChanged: UserNameChanged
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameClaimed {
        #[key]
        address: ContractAddress,
        username: felt252
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameChanged {
        #[key]
        address: ContractAddress,
        old_username: felt252,
        new_username: felt252
    }

    #[abi(embed_v0)]
    impl UsernameStore of IUsernameStore<ContractState> {
        fn claim_username(ref self: ContractState, key: felt252) {
            let caller_address = get_caller_address();

            assert(
                self.user_to_username.read(caller_address) == 0,
                UserNameClaimErrors::USER_HAS_USERNAME
            );

            let username_address = self.usernames.read(key);
            assert(
                username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            self.usernames.write(key, caller_address);
            self.user_to_username.write(caller_address, key);

            self.emit(UserNameClaimed { username: key, address: caller_address });
        }

        fn change_username(ref self: ContractState, new_username: felt252) {
            let caller_address = get_caller_address();
            let old_username = self.user_to_username.read(caller_address);
            assert(old_username != 0, UserNameClaimErrors::USER_DOESNT_HAVE_USERNAME);

            let new_username_address = self.usernames.read(new_username);
            assert(
                new_username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            self.usernames.write(old_username, contract_address_const::<0>());
            self.usernames.write(new_username, caller_address);
            self.user_to_username.write(caller_address, new_username);

            self
                .emit(
                    UserNameChanged {
                        old_username: old_username,
                        new_username: new_username,
                        address: caller_address
                    }
                );
        }

        fn get_username(self: @ContractState, address: ContractAddress) -> felt252 {
            self.user_to_username.read(address)
        }

        fn get_username_address(self: @ContractState, key: felt252) -> ContractAddress {
            self.usernames.read(key)
        }
    }
}
