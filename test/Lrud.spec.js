/* eslint-env mocha, chai */

const { expect } = require('chai')
const sinon = require('sinon')
const Lrud = require('../src')
const constants = require('../src/constants')

describe('Given an instance of Lrud', () => {
  let navigation

  beforeEach(() => {
    Lrud.KEY_CODES = constants.DEFAULT_KEY_CODES
    Lrud.KEY_MAP = constants.DEFAULT_KEY_MAP
    navigation = new Lrud()
  })

  describe('register', () => {
    it('should throw an error when attempting to register without an id', () => {
      expect(() => navigation.register()).to.throw('Attempting to register with an invalid id')
    })

    it('should add a node as expected', () => {
      navigation.register('root')

      expect(navigation.nodes).to.deep.equal({
        root: {
          parent: null,
          children: [],
          activeChild: null
        }
      })
    })

    it('should crate the parent/child relationship as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.nodes.root.children).to.deep.equal([ 'child' ])
      expect(navigation.nodes.child.parent).to.equal('root')
    })

    it('should maintain the child order if a node is registered multiple times', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child', { parent: 'root' })

      expect(navigation.nodes.root.children).to.deep.equal([
        'child',
        'child2'
      ])
    })
  })

  describe('unregister', () => {
    it('should remove a node as expected', () => {
      navigation.register('root')
      navigation.unregister('root')

      expect(navigation.nodes.root).to.equal(undefined)
    })

    it('should undo the parent/child relationship as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.unregister('child')

      expect(navigation.nodes.root.children).to.deep.equal([])
    })

    it('should remove the children of the unregistered node', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.unregister('root')

      expect(navigation.nodes.child).to.equal(undefined)
      expect(navigation.nodes.child2).to.equal(undefined)
    })

    it('should blur the \'currentFocus\' node if it is the node being unregistered', () => {
      const spy = sinon.spy()

      navigation.on('blur', spy)
      navigation.register('root')
      navigation.currentFocus = 'root'
      navigation.unregister('root')

      expect(navigation.currentFocus).to.equal(null)
      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should not blur the \'currentFocus\' node if it is not the node being unregistered', () => {
      const spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.unregister('child2')

      expect(navigation.currentFocus).to.equal('child')
      expect(spy.notCalled).to.equal(true)
    })

    it('should unset the \'activeChild\' of the parent if the unregisted node is the currect active child', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.nodes.root.activeChild = 'child2'
      navigation.unregister('child2')

      expect(navigation.nodes.root.activeChild).to.equal(null)
    })
  })

  describe('blur', () => {
    it('should emit the blur event with node id as expected', () => {
      const spy = sinon.spy()

      navigation.on('blur', spy)
      navigation.register('root')
      navigation.blur('root')

      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should blur the \'currentFocus\' node if no arguments are provided', () => {
      const spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.blur()

      expect(spy.calledWith('child')).to.equal(true)
    })
  })

  describe('focus', () => {
    it('should emit the focus event with node id as expected', () => {
      const spy = sinon.spy()

      navigation.on('focus', spy)
      navigation.register('root')
      navigation.focus('root')

      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should focus down the tree to the first focusable child', () => {
      const spy = sinon.spy()

      navigation.on('focus', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.focus('root')

      expect(spy.calledWith('child')).to.equal(true)
    })

    it('should update the \'currentFocus\' prop as expected', () => {
      const spy = sinon.spy()

      navigation.on('focus', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.currentFocus).to.equal(null)

      navigation.focus('root')

      expect(navigation.currentFocus).to.equal('child')
    })

    it('should focus the \'currentFocus\' node if no arguments are provided', () => {
      const spy = sinon.spy()

      navigation.currentFocus = 'child2'

      navigation.on('focus', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.focus()

      expect(spy.calledWith('child2')).to.equal(true)
    })

    it('should emit a blur event for the previously focused node', () => {
      const spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.focus('child2')

      expect(spy.calledWith('child')).to.equal(true)
    })
  })
})