// Import all required modules from openzeppelin-test-helpers
const {
  BN,
  constants,
  expectEvent,
  expectRevert
} = require('openzeppelin-test-helpers')

// Import preferred chai flavor: both expect and should are supported
const { expect } = require('chai')

const BAP = artifacts.require('BinaryArbitrableProxy')
const Arbitrator = artifacts.require('Arbitrator')
const AutoAppealableArbitrator = artifacts.require('AutoAppealableArbitrator')

const ARBITRATION_COST = 1000000000

contract(
  'BinaryArbitrableProxy',
  ([sender, receiver, thirdParty, fourthParty]) => {
    before(async function() {
      this.bap = await BAP.new()
      this.aaa = await AutoAppealableArbitrator.new(1000000000)
    })

    it('creates a dispute', async function() {
      await this.bap.createDispute(this.aaa.address, '0x0', '', {
        value: ARBITRATION_COST
      })

      await this.aaa.disputes(0)
    })

    it('it appeals a dispute', async function() {
      await this.aaa.giveAppealableRuling(0, 0, 1000000000, 240)

      assert(new BN('1').eq((await this.aaa.disputes(0)).status))

      await this.bap.appeal(0, 1, { value: 1000000000, from: thirdParty })
      await this.bap.appeal(0, 2, { value: 1000000000, from: fourthParty })

      assert(new BN('0').eq((await this.aaa.disputes(0)).status))
    })

    it('withdraws fees and rewards', async function() {
      await this.aaa.giveRuling(0, 1)

      let previousBalanceOfThirdParty = await web3.eth.getBalance(thirdParty)
      let previousBalanceOfFourthParty = await web3.eth.getBalance(fourthParty)
      await this.bap.withdrawFeesAndRewards(0, thirdParty, 0)
      await this.bap.withdrawFeesAndRewards(0, fourthParty, 0)

      let currentBalanceOfThirdParty = await web3.eth.getBalance(thirdParty)
      let currentBalanceOfFourthParty = await web3.eth.getBalance(fourthParty)
      assert(
        new BN(currentBalanceOfThirdParty).eq(
          new BN(previousBalanceOfThirdParty).add(new BN(1000000000))
        )
      )

      assert(
        new BN(currentBalanceOfFourthParty).eq(
          new BN(previousBalanceOfFourthParty)
        )
      )
    })
  }
)
