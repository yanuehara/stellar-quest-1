const { Server, Keypair, TransactionBuilder, BASE_FEE, Networks, Operation, Asset } = require('stellar-sdk')
const parseError = require('@runkit/tyvdh/parse-error/2.0.0')
const { chain, map } = require('lodash')
const BigNubmer = require('bignumber.js')
const Promise = require('bluebird')

try {
    const server = new Server('https://horizon-testnet.stellar.org')
    
    const XLM = Asset.native()
    const SRT = new Asset('SRT', 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B')
    const amount = '10'
    
    const myKeypair = Keypair.fromSecret('SBWHGXDQH4BQIBI56E6CPIF56NW7PZX7LKMLPC2OOKSUDJJVSL7GJBT3')
    const myPublicKey = myKeypair.publicKey()
    
    await server.loadAccount(myPublicKey)
    .then(async (account) => {
        const isCompleted = !!await account.operations({order: 'desc', limit: 200})
        .then(({records}) => chain(records)
            .filter((record) => record.type.indexOf('path_payment') > -1)
            .find((record) => 
                record.asset_code === SRT.getCode() 
                && record.asset_issuer === SRT.getIssuer()
            )
            .value()
        )
    
        if (isCompleted) 
            return console.log('Account has already received the SRT asset')
    
        console.log('Account exists and is ready to send a path payment')
        
        const {records: paths} = await server.strictSendPaths(XLM, amount, [SRT]).call()
        
        if (
            !paths 
            || paths.length === 0
        ) throw 'No paths currently exist for SRT 😱. Might want to let Tyler know via Discord.'
        
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.changeTrust({
            asset: SRT
        }))
        .addOperation(Operation.pathPaymentStrictSend({
            sendAsset: XLM,
            sendAmount: amount,
            destination: myPublicKey,
            destAsset: SRT,
            destMin: '0.0000001',
            path: map(paths[0].path, ({asset_code, asset_issuer}) => new Asset(asset_code, asset_issuer)),
        }))
        .setTimeout(0)
        .build()

        transaction.sign(myKeypair)

        console.log('Path payment transaction has been prepared and signed')
        await server.submitTransaction(transaction)
        console.log('Path payment transaction was successfully submitted')
    })
}

catch(err) {
    console.error(parseError(err))
}
