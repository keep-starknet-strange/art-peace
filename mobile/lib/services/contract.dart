import 'package:starknet/starknet.dart';
import 'package:starknet_provider/starknet_provider.dart';
import '../ui/screens/home.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:wallet_kit/wallet_kit.dart' as wallet_kit;

final artPeaceContract = '0x02458a105b42db469fb1f8b35ab3ce126dab5a0881ad3c2bbf36bec0a34168c5';

Future<void> placePixels(Account starknetAccount, List<PixelData> pixels, int canvasWidth, int canvasId, int now) async {
  print('Placing pixels...');
  final pixelPositions = pixels.map((pixel) => Felt.fromInt(pixel.x + pixel.y * canvasWidth)).toList();
  final calldata = [
    Felt.fromInt(canvasId),
    Felt.fromInt(pixels.length),
    ...pixelPositions,
    Felt.fromInt(pixels.length),
    ...pixels.map((pixel) => Felt.fromInt(pixel.color)),
    Felt.fromInt(now),
  ];
  print('Calldata: $calldata');
  final response = await starknetAccount.execute(
    functionCalls: [
      FunctionCall(
        contractAddress: Felt.fromHexString(artPeaceContract),
        entryPointSelector: getSelectorByName('place_pixels'),
        calldata: calldata,
      ),
    ],
    max_fee: Felt.fromInt((0.0001 * 1e18).toInt()),
  );
  final txHash = response.when(
    result: (result) => result.transaction_hash,
    error: (error) {
      print('Error placing pixels: $error');
      return null;
    },
  )!;
  print('Transaction hash: $txHash');
  await waitForAcceptance(transactionHash: txHash, provider: wallet_kit.WalletKit().provider);
}
