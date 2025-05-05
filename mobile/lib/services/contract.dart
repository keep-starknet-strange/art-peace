import 'package:starknet/starknet.dart';
import 'package:starknet_provider/starknet_provider.dart';
import '../ui/screens/home.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

final provider = JsonRpcProvider(nodeUri: Uri.parse('https://starknet-mainnet.public.blastapi.io/rpc/v0_8'));
final artPeaceContract = '0x02458a105b42db469fb1f8b35ab3ce126dab5a0881ad3c2bbf36bec0a34168c5';
final secretAccountAddress = dotenv.env['ACCOUNT_ADDRESS'] ?? '0x00';
final secretAccountPrivKey = dotenv.env['ACCOUNT_KEY'] ?? '0x00';
final signeraccount = getAccount(
  accountAddress: Felt.fromHexString(secretAccountAddress),
  privateKey: Felt.fromHexString(secretAccountPrivKey),
  nodeUri: Uri.parse('https://starknet-mainnet.public.blastapi.io/rpc/v0_6'),
);

Future<void> placePixels(List<PixelData> pixels, int canvasWidth, int canvasId, int now) async {
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
  final response = await signeraccount.execute(
    functionCalls: [
      FunctionCall(
        contractAddress: Felt.fromHexString(artPeaceContract),
        entryPointSelector: getSelectorByName('place_pixels'),
        calldata: calldata,
      ),
    ],
  );
  final txHash = response.when(
    result: (result) => result.transaction_hash,
    error: (error) {
      print('Error placing pixels: $error');
      return null;
    },
  )!;
  print('Transaction hash: $txHash');
  await waitForAcceptance(transactionHash: txHash, provider: provider);
}
