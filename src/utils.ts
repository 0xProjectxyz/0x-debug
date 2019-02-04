import { assetDataUtils, ERC20AssetData, Order, RPCSubprovider, Web3ProviderEngine } from '0x.js';
import _ = require('lodash');
enum Networks {
    Mainnet = 1,
    Goerli = 5,
    Ropsten = 3,
    Kovan = 42,
    Ganache = 50,
}

const NETWORK_ID_TO_RPC_URL: { [key in Networks]: string } = {
    [Networks.Kovan]: 'https://kovan.infura.io',
    [Networks.Mainnet]: 'https://mainnet.infura.io',
    [Networks.Ropsten]: 'https://ropsten.infura.io',
    [Networks.Goerli]: 'http://localhost:8545',
    [Networks.Ganache]: 'http://localhost:8545',
};

export const utils = {
    getNetworkId(flags: any): number {
        const networkId = flags['network-id'];
        if (!networkId) {
            throw new Error('NETWORK_ID_REQUIRED');
        }
        return networkId;
    },
    getProvider(flags: any): Web3ProviderEngine {
        const networkId = utils.getNetworkId(flags);
        const rpcSubprovider = new RPCSubprovider(utils.getNetworkRPCOrThrow(networkId));
        const provider = new Web3ProviderEngine();
        provider.addProvider(rpcSubprovider);
        provider.start();
        return provider;
    },
    getNetworkRPCOrThrow(networkId: Networks): string {
        const url = NETWORK_ID_TO_RPC_URL[networkId];
        if (_.isUndefined(url)) {
            throw new Error('UNSUPPORTED_NETWORK');
        }
        return url;
    },
    extractOrders(inputArguments: any): Order[] {
        const orders: Order[] = [];
        if (inputArguments.order) {
            orders.push(inputArguments.order);
        } else if (inputArguments.orders) {
            _.forEach(inputArguments.orders, (order, index) => {
                orders.push(order);
            });
        }
        return orders;
    },
    extractAccountsAndTokens(orders: Order[]) {
        let accounts = { taker: '' };
        let tokens = {};
        _.forEach(orders, (order, index) => {
            const extractedMakerTaker = utils.extractMakerTaker(order, index.toString());
            const extractedTokens = utils.extractTokens(order, index.toString());
            accounts = _.merge(accounts, extractedMakerTaker);
            tokens = _.merge(tokens, extractedTokens);
        });
        return {
            accounts,
            tokens,
        };
    },
    extractMakerTaker(order: Order, position: string = '') {
        const accounts = {
            [`maker${position}`]: order.makerAddress,
        };
        return accounts;
    },
    extractTokens(order: Order, position: string = '') {
        const makerAssetData = assetDataUtils.decodeAssetDataOrThrow(order.makerAssetData) as ERC20AssetData;
        const takerAssetData = assetDataUtils.decodeAssetDataOrThrow(order.takerAssetData) as ERC20AssetData;
        const tokens = {
            [`makerToken${position}`]: makerAssetData.tokenAddress,
            [`takerToken${position}`]: takerAssetData.tokenAddress,
        };
        return tokens;
    },
};
