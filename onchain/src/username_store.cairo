use starknet::ContractAddress;

pub mod UserNameClaimErrors {
    pub const USERNAME_CLAIMED: felt252 = 'username_claimed';
    pub const USERNAME_CANNOT_BE_TRANSFER : felt252 = 'username_cannot_be_transferred';
}

#[starknet::interface]
pub trait IUsernameStore<TContractState> {
    fn claim_username(ref self: TContractState, key: felt252);
    fn transfer_username(ref self: TContractState, key: felt252, new_Address: ContractAddress);
}

#[starknet::contract]
pub mod UsernameStore {
    use starknet::{get_caller_address, ContractAddress};
    
    use super::UserNameClaimErrors;

    #[storage]
    struct Storage {
        username: LegacyMap::<felt252, ContractAddress>
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        UserNameClaimed: UserNameClaimed,
        UserNameTransferred: UserNameTransferred
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameClaimed {
        #[key]
        username: felt252,
        address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameTransferred {
        #[key]
        username: felt252,
        address: ContractAddress
    }

    #[abi(embed_v0)]
    impl UsernameStore of super::IUsernameStore<ContractState> {

        fn claim_username(ref self: ContractState, key: felt252) {
            let mut username = self.username.read(key);
        
            if username == get_caller_address()  {
                core::panic_with_felt252(UserNameClaimErrors::USERNAME_CLAIMED);
            }
         
            self.username.write(key, get_caller_address());

           
             self.emit(
                Event::UserNameClaimed(
                    UserNameClaimed {
                       username: key, address: get_caller_address()
                    }
                )
            )
        }

        fn transfer_username(ref self: ContractState, key: felt252, new_Address: ContractAddress) {
            let usernameAddress = self.username.read(key);
            
            if usernameAddress != get_caller_address() {
                core::panic_with_felt252(UserNameClaimErrors::USERNAME_CANNOT_BE_TRANSFER);
            }
             
            self.username.write(key, new_Address);

           
             self.emit(
                Event::UserNameTransferred(
                    UserNameTransferred {
                       username: key, address: new_Address
                    }
                )
            )

        }
    }
}

