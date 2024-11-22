use core::starknet::{ContractAddress, ClassHash};
use art_peace::canvas::Canvas;

#[starknet::interface]
pub trait ICanvasFactory<TContractState> {
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn set_owner(ref self: TContractState, owner: ContractAddress);
    fn get_canvas_class_hash(self: @TContractState) -> ClassHash;
    fn set_canvas_class_hash(ref self: TContractState, canvas_class_hash: ClassHash);
    fn get_canvas_count(self: @TContractState) -> u64;
    fn create_canvas(ref self: TContractState, init_params: Canvas::InitParams) -> (ContractAddress, u64);
    fn get_canvas(self: @TContractState, canvas_id: u64) -> ContractAddress;
}

#[starknet::contract]
pub mod CanvasFactory {
    use starknet::syscalls::deploy_syscall;
    use core::starknet::{get_caller_address, ContractAddress, ClassHash};
    use art_peace::canvas::Canvas;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        canvas_class_hash: ClassHash,
        canvases: LegacyMap::<u64, ContractAddress>,
        canvas_count: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        HostChanged: HostChanged,
        CanvasCreated: CanvasCreated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct HostChanged {
        pub old_host: ContractAddress,
        pub new_host: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CanvasCreated {
        #[key]
        pub canvas_id: u64,
        pub canvas_address: ContractAddress,
        pub init_params: Canvas::InitParams,
    }

    #[derive(Drop, Serde)]
    pub struct InitParams {
        pub owner: ContractAddress,
        pub canvas_class_hash: ClassHash,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: InitParams) {
        self.owner.write(init_params.owner);
        self.canvas_class_hash.write(init_params.canvas_class_hash);
    }

    #[abi(embed_v0)]
    impl CanvasFactoryImpl of super::ICanvasFactory<ContractState> {
        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn set_owner(ref self: ContractState, owner: ContractAddress) {
            let caller = get_caller_address();
            assert(self.owner.read() == caller, 'Only owner can change owner');
            self.owner.write(owner);
            self.emit(Event::HostChanged(HostChanged {
                old_host: caller,
                new_host: owner,
            }));
        }

        fn get_canvas_class_hash(self: @ContractState) -> ClassHash {
            self.canvas_class_hash.read()
        }

        fn set_canvas_class_hash(ref self: ContractState, canvas_class_hash: ClassHash) {
            let caller = get_caller_address();
            assert(self.owner.read() == caller, 'Only owner can set canvas hash');
            self.canvas_class_hash.write(canvas_class_hash);
        }

        fn get_canvas_count(self: @ContractState) -> u64 {
            self.canvas_count.read()
        }

        fn create_canvas(ref self: ContractState, init_params: super::Canvas::InitParams) -> (ContractAddress, u64) {
            // TODO: Serialize before calling this function to defer serialization to the contract input
            let mut init_params_serialized = array![];
            init_params.serialize(ref init_params_serialized);
            let deploy_res = deploy_syscall(self.canvas_class_hash.read(), self.canvas_count.read().into(), init_params_serialized.span(), true);
            if deploy_res.is_err() {
                panic!("Failed to deploy canvas contract");
            }
            let (addr, _response) = deploy_res.unwrap();
            let canvas_id = self.canvas_count.read();
            self.canvases.write(canvas_id, addr);
            self.canvas_count.write(canvas_id + 1);
            self.emit(Event::CanvasCreated(CanvasCreated {
                canvas_id,
                canvas_address: addr,
                init_params,
            }));
            (addr, canvas_id)
        }

        fn get_canvas(self: @ContractState, canvas_id: u64) -> ContractAddress {
            self.canvases.read(canvas_id)
        }
    }
}
