import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:starknet/starknet.dart';
import 'package:starknet_provider/starknet_provider.dart';
import 'package:wallet_kit/wallet_kit.dart' as wallet_kit;

class AccountPage extends HookConsumerWidget {
  const AccountPage({super.key, required this.setStarknetAccount});
  final Function(Account) setStarknetAccount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedAccount = ref.watch(wallet_kit.walletsProvider.select(
      (value) => value.selectedAccount,
    ));

    return Scaffold(
      body: wallet_kit.Layout2(
        children: [
          SizedBox(height: 32),
          Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              wallet_kit.WalletSelector(),
              wallet_kit.AccountAddress(),
              wallet_kit.DeployAccountButton(),
            ],
          ),
          wallet_kit.WalletBody(),
          IconButton(
            padding: const EdgeInsets.all(20),
            icon: Icon(Icons.refresh),
            iconSize: 32,
            onPressed: () async {
              // Trigger the transaction
              if (selectedAccount == null) {
                wallet_kit.showWalletList(context);
                return;
              }
              final secureStore = await ref
                .read(wallet_kit.walletsProvider.notifier)
                .getSecureStoreForWallet(context: context);

              final starknetAccount = await wallet_kit.WalletService.getStarknetAccount(
                secureStore: secureStore,
                walletId: selectedAccount.walletId,
                account: selectedAccount,
              );
              setStarknetAccount(starknetAccount);
            },
          ),
        ],
      ),
    );
  }
}
