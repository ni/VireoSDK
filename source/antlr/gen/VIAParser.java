// Generated from /Users/paulaustin/repos/NI_VireoSDK/source/antlr/VIA.g4 by ANTLR 4.5
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.misc.*;
import org.antlr.v4.runtime.tree.*;
import java.util.List;
import java.util.Iterator;
import java.util.ArrayList;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class VIAParser extends Parser {
	static { RuntimeMetaData.checkVersion("4.5", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		T__0=1, T__1=2, T__2=3, T__3=4, T__4=5, T__5=6, STRING=7, BOOLEAN=8, NUMBER=9, 
		INVALID_NUMBER=10, SIMPLE_SYMBOL=11, TEMPLATED_SYMBOL=12, CLOSE_TEMPLATE=13, 
		INVOKE_SYMBOL=14, CLOSE_INVOKE=15, FIELD_NAME=16, WS=17, BLOCK_COMMENT=18, 
		LINE_COMMENT=19;
	public static final int
		RULE_viaStream = 0, RULE_symbol = 1, RULE_literal = 2, RULE_viaCollection = 3, 
		RULE_jsonishArray = 4, RULE_jsonishCluster = 5, RULE_temaplateSymbol = 6, 
		RULE_invokeSymbol = 7, RULE_element = 8, RULE_fieldName = 9;
	public static final String[] ruleNames = {
		"viaStream", "symbol", "literal", "viaCollection", "jsonishArray", "jsonishCluster", 
		"temaplateSymbol", "invokeSymbol", "element", "fieldName"
	};

	private static final String[] _LITERAL_NAMES = {
		null, "'('", "'['", "','", "']'", "'{'", "'}'", null, null, null, null, 
		null, null, "'>'", null, "')'"
	};
	private static final String[] _SYMBOLIC_NAMES = {
		null, null, null, null, null, null, null, "STRING", "BOOLEAN", "NUMBER", 
		"INVALID_NUMBER", "SIMPLE_SYMBOL", "TEMPLATED_SYMBOL", "CLOSE_TEMPLATE", 
		"INVOKE_SYMBOL", "CLOSE_INVOKE", "FIELD_NAME", "WS", "BLOCK_COMMENT", 
		"LINE_COMMENT"
	};
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override
	@NotNull
	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}

	@Override
	public String getGrammarFileName() { return "VIA.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public ATN getATN() { return _ATN; }

	public VIAParser(TokenStream input) {
		super(input);
		_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}
	public static class ViaStreamContext extends ParserRuleContext {
		public List<SymbolContext> symbol() {
			return getRuleContexts(SymbolContext.class);
		}
		public SymbolContext symbol(int i) {
			return getRuleContext(SymbolContext.class,i);
		}
		public ViaStreamContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_viaStream; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterViaStream(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitViaStream(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitViaStream(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ViaStreamContext viaStream() throws RecognitionException {
		ViaStreamContext _localctx = new ViaStreamContext(_ctx, getState());
		enterRule(_localctx, 0, RULE_viaStream);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(20); 
			symbol();
			setState(24);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << T__0) | (1L << T__1) | (1L << T__4) | (1L << STRING) | (1L << BOOLEAN) | (1L << NUMBER) | (1L << SIMPLE_SYMBOL) | (1L << TEMPLATED_SYMBOL) | (1L << INVOKE_SYMBOL))) != 0)) {
				{
				{
				setState(21); 
				symbol();
				}
				}
				setState(26);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class SymbolContext extends ParserRuleContext {
		public LiteralContext literal() {
			return getRuleContext(LiteralContext.class,0);
		}
		public TemaplateSymbolContext temaplateSymbol() {
			return getRuleContext(TemaplateSymbolContext.class,0);
		}
		public InvokeSymbolContext invokeSymbol() {
			return getRuleContext(InvokeSymbolContext.class,0);
		}
		public ViaCollectionContext viaCollection() {
			return getRuleContext(ViaCollectionContext.class,0);
		}
		public JsonishArrayContext jsonishArray() {
			return getRuleContext(JsonishArrayContext.class,0);
		}
		public JsonishClusterContext jsonishCluster() {
			return getRuleContext(JsonishClusterContext.class,0);
		}
		public TerminalNode SIMPLE_SYMBOL() { return getToken(VIAParser.SIMPLE_SYMBOL, 0); }
		public SymbolContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_symbol; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterSymbol(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitSymbol(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitSymbol(this);
			else return visitor.visitChildren(this);
		}
	}

	public final SymbolContext symbol() throws RecognitionException {
		SymbolContext _localctx = new SymbolContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_symbol);
		try {
			setState(34);
			switch (_input.LA(1)) {
			case STRING:
			case BOOLEAN:
			case NUMBER:
				enterOuterAlt(_localctx, 1);
				{
				setState(27); 
				literal();
				}
				break;
			case TEMPLATED_SYMBOL:
				enterOuterAlt(_localctx, 2);
				{
				setState(28); 
				temaplateSymbol();
				}
				break;
			case INVOKE_SYMBOL:
				enterOuterAlt(_localctx, 3);
				{
				setState(29); 
				invokeSymbol();
				}
				break;
			case T__0:
				enterOuterAlt(_localctx, 4);
				{
				setState(30); 
				viaCollection();
				}
				break;
			case T__1:
				enterOuterAlt(_localctx, 5);
				{
				setState(31); 
				jsonishArray();
				}
				break;
			case T__4:
				enterOuterAlt(_localctx, 6);
				{
				setState(32); 
				jsonishCluster();
				}
				break;
			case SIMPLE_SYMBOL:
				enterOuterAlt(_localctx, 7);
				{
				setState(33); 
				match(SIMPLE_SYMBOL);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class LiteralContext extends ParserRuleContext {
		public TerminalNode BOOLEAN() { return getToken(VIAParser.BOOLEAN, 0); }
		public TerminalNode NUMBER() { return getToken(VIAParser.NUMBER, 0); }
		public TerminalNode STRING() { return getToken(VIAParser.STRING, 0); }
		public LiteralContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_literal; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterLiteral(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitLiteral(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitLiteral(this);
			else return visitor.visitChildren(this);
		}
	}

	public final LiteralContext literal() throws RecognitionException {
		LiteralContext _localctx = new LiteralContext(_ctx, getState());
		enterRule(_localctx, 4, RULE_literal);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(36);
			_la = _input.LA(1);
			if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << STRING) | (1L << BOOLEAN) | (1L << NUMBER))) != 0)) ) {
			_errHandler.recoverInline(this);
			}
			consume();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ViaCollectionContext extends ParserRuleContext {
		public List<ElementContext> element() {
			return getRuleContexts(ElementContext.class);
		}
		public ElementContext element(int i) {
			return getRuleContext(ElementContext.class,i);
		}
		public ViaCollectionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_viaCollection; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterViaCollection(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitViaCollection(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitViaCollection(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ViaCollectionContext viaCollection() throws RecognitionException {
		ViaCollectionContext _localctx = new ViaCollectionContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_viaCollection);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(38); 
			match(T__0);
			setState(42);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << T__0) | (1L << T__1) | (1L << T__4) | (1L << STRING) | (1L << BOOLEAN) | (1L << NUMBER) | (1L << SIMPLE_SYMBOL) | (1L << TEMPLATED_SYMBOL) | (1L << INVOKE_SYMBOL) | (1L << FIELD_NAME))) != 0)) {
				{
				{
				setState(39); 
				element();
				}
				}
				setState(44);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(45); 
			match(CLOSE_INVOKE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class JsonishArrayContext extends ParserRuleContext {
		public List<SymbolContext> symbol() {
			return getRuleContexts(SymbolContext.class);
		}
		public SymbolContext symbol(int i) {
			return getRuleContext(SymbolContext.class,i);
		}
		public JsonishArrayContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_jsonishArray; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterJsonishArray(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitJsonishArray(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitJsonishArray(this);
			else return visitor.visitChildren(this);
		}
	}

	public final JsonishArrayContext jsonishArray() throws RecognitionException {
		JsonishArrayContext _localctx = new JsonishArrayContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_jsonishArray);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(47); 
			match(T__1);
			setState(49);
			switch ( getInterpreter().adaptivePredict(_input,3,_ctx) ) {
			case 1:
				{
				setState(48); 
				symbol();
				}
				break;
			}
			setState(57);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << T__0) | (1L << T__1) | (1L << T__2) | (1L << T__4) | (1L << STRING) | (1L << BOOLEAN) | (1L << NUMBER) | (1L << SIMPLE_SYMBOL) | (1L << TEMPLATED_SYMBOL) | (1L << INVOKE_SYMBOL))) != 0)) {
				{
				{
				setState(52);
				_la = _input.LA(1);
				if (_la==T__2) {
					{
					setState(51); 
					match(T__2);
					}
				}

				setState(54); 
				symbol();
				}
				}
				setState(59);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(60); 
			match(T__3);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class JsonishClusterContext extends ParserRuleContext {
		public List<FieldNameContext> fieldName() {
			return getRuleContexts(FieldNameContext.class);
		}
		public FieldNameContext fieldName(int i) {
			return getRuleContext(FieldNameContext.class,i);
		}
		public List<SymbolContext> symbol() {
			return getRuleContexts(SymbolContext.class);
		}
		public SymbolContext symbol(int i) {
			return getRuleContext(SymbolContext.class,i);
		}
		public JsonishClusterContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_jsonishCluster; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterJsonishCluster(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitJsonishCluster(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitJsonishCluster(this);
			else return visitor.visitChildren(this);
		}
	}

	public final JsonishClusterContext jsonishCluster() throws RecognitionException {
		JsonishClusterContext _localctx = new JsonishClusterContext(_ctx, getState());
		enterRule(_localctx, 10, RULE_jsonishCluster);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(62); 
			match(T__4);
			setState(66);
			switch ( getInterpreter().adaptivePredict(_input,6,_ctx) ) {
			case 1:
				{
				setState(63); 
				fieldName();
				setState(64); 
				symbol();
				}
				break;
			}
			setState(76);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__2 || _la==FIELD_NAME) {
				{
				{
				setState(69);
				_la = _input.LA(1);
				if (_la==T__2) {
					{
					setState(68); 
					match(T__2);
					}
				}

				setState(71); 
				fieldName();
				setState(72); 
				symbol();
				}
				}
				setState(78);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(79); 
			match(T__5);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class TemaplateSymbolContext extends ParserRuleContext {
		public TerminalNode TEMPLATED_SYMBOL() { return getToken(VIAParser.TEMPLATED_SYMBOL, 0); }
		public TerminalNode CLOSE_TEMPLATE() { return getToken(VIAParser.CLOSE_TEMPLATE, 0); }
		public List<ElementContext> element() {
			return getRuleContexts(ElementContext.class);
		}
		public ElementContext element(int i) {
			return getRuleContext(ElementContext.class,i);
		}
		public TemaplateSymbolContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_temaplateSymbol; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterTemaplateSymbol(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitTemaplateSymbol(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitTemaplateSymbol(this);
			else return visitor.visitChildren(this);
		}
	}

	public final TemaplateSymbolContext temaplateSymbol() throws RecognitionException {
		TemaplateSymbolContext _localctx = new TemaplateSymbolContext(_ctx, getState());
		enterRule(_localctx, 12, RULE_temaplateSymbol);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(81); 
			match(TEMPLATED_SYMBOL);
			setState(85);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << T__0) | (1L << T__1) | (1L << T__4) | (1L << STRING) | (1L << BOOLEAN) | (1L << NUMBER) | (1L << SIMPLE_SYMBOL) | (1L << TEMPLATED_SYMBOL) | (1L << INVOKE_SYMBOL) | (1L << FIELD_NAME))) != 0)) {
				{
				{
				setState(82); 
				element();
				}
				}
				setState(87);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(88); 
			match(CLOSE_TEMPLATE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class InvokeSymbolContext extends ParserRuleContext {
		public TerminalNode INVOKE_SYMBOL() { return getToken(VIAParser.INVOKE_SYMBOL, 0); }
		public TerminalNode CLOSE_INVOKE() { return getToken(VIAParser.CLOSE_INVOKE, 0); }
		public List<ElementContext> element() {
			return getRuleContexts(ElementContext.class);
		}
		public ElementContext element(int i) {
			return getRuleContext(ElementContext.class,i);
		}
		public InvokeSymbolContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_invokeSymbol; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterInvokeSymbol(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitInvokeSymbol(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitInvokeSymbol(this);
			else return visitor.visitChildren(this);
		}
	}

	public final InvokeSymbolContext invokeSymbol() throws RecognitionException {
		InvokeSymbolContext _localctx = new InvokeSymbolContext(_ctx, getState());
		enterRule(_localctx, 14, RULE_invokeSymbol);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(90); 
			match(INVOKE_SYMBOL);
			setState(94);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << T__0) | (1L << T__1) | (1L << T__4) | (1L << STRING) | (1L << BOOLEAN) | (1L << NUMBER) | (1L << SIMPLE_SYMBOL) | (1L << TEMPLATED_SYMBOL) | (1L << INVOKE_SYMBOL) | (1L << FIELD_NAME))) != 0)) {
				{
				{
				setState(91); 
				element();
				}
				}
				setState(96);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(97); 
			match(CLOSE_INVOKE);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ElementContext extends ParserRuleContext {
		public SymbolContext symbol() {
			return getRuleContext(SymbolContext.class,0);
		}
		public FieldNameContext fieldName() {
			return getRuleContext(FieldNameContext.class,0);
		}
		public ElementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_element; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterElement(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitElement(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitElement(this);
			else return visitor.visitChildren(this);
		}
	}

	public final ElementContext element() throws RecognitionException {
		ElementContext _localctx = new ElementContext(_ctx, getState());
		enterRule(_localctx, 16, RULE_element);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			{
			setState(100);
			_la = _input.LA(1);
			if (_la==FIELD_NAME) {
				{
				setState(99); 
				fieldName();
				}
			}

			setState(102); 
			symbol();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class FieldNameContext extends ParserRuleContext {
		public TerminalNode FIELD_NAME() { return getToken(VIAParser.FIELD_NAME, 0); }
		public FieldNameContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_fieldName; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).enterFieldName(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof VIAListener ) ((VIAListener)listener).exitFieldName(this);
		}
		@Override
		public <T> T accept(ParseTreeVisitor<? extends T> visitor) {
			if ( visitor instanceof VIAVisitor ) return ((VIAVisitor<? extends T>)visitor).visitFieldName(this);
			else return visitor.visitChildren(this);
		}
	}

	public final FieldNameContext fieldName() throws RecognitionException {
		FieldNameContext _localctx = new FieldNameContext(_ctx, getState());
		enterRule(_localctx, 18, RULE_fieldName);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(104); 
			match(FIELD_NAME);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static final String _serializedATN =
		"\3\u0430\ud6d1\u8206\uad2d\u4417\uaef1\u8d80\uaadd\3\25m\4\2\t\2\4\3\t"+
		"\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4\13\t\13\3"+
		"\2\3\2\7\2\31\n\2\f\2\16\2\34\13\2\3\3\3\3\3\3\3\3\3\3\3\3\3\3\5\3%\n"+
		"\3\3\4\3\4\3\5\3\5\7\5+\n\5\f\5\16\5.\13\5\3\5\3\5\3\6\3\6\5\6\64\n\6"+
		"\3\6\5\6\67\n\6\3\6\7\6:\n\6\f\6\16\6=\13\6\3\6\3\6\3\7\3\7\3\7\3\7\5"+
		"\7E\n\7\3\7\5\7H\n\7\3\7\3\7\3\7\7\7M\n\7\f\7\16\7P\13\7\3\7\3\7\3\b\3"+
		"\b\7\bV\n\b\f\b\16\bY\13\b\3\b\3\b\3\t\3\t\7\t_\n\t\f\t\16\tb\13\t\3\t"+
		"\3\t\3\n\5\ng\n\n\3\n\3\n\3\13\3\13\3\13\2\2\f\2\4\6\b\n\f\16\20\22\24"+
		"\2\3\3\2\t\13s\2\26\3\2\2\2\4$\3\2\2\2\6&\3\2\2\2\b(\3\2\2\2\n\61\3\2"+
		"\2\2\f@\3\2\2\2\16S\3\2\2\2\20\\\3\2\2\2\22f\3\2\2\2\24j\3\2\2\2\26\32"+
		"\5\4\3\2\27\31\5\4\3\2\30\27\3\2\2\2\31\34\3\2\2\2\32\30\3\2\2\2\32\33"+
		"\3\2\2\2\33\3\3\2\2\2\34\32\3\2\2\2\35%\5\6\4\2\36%\5\16\b\2\37%\5\20"+
		"\t\2 %\5\b\5\2!%\5\n\6\2\"%\5\f\7\2#%\7\r\2\2$\35\3\2\2\2$\36\3\2\2\2"+
		"$\37\3\2\2\2$ \3\2\2\2$!\3\2\2\2$\"\3\2\2\2$#\3\2\2\2%\5\3\2\2\2&\'\t"+
		"\2\2\2\'\7\3\2\2\2(,\7\3\2\2)+\5\22\n\2*)\3\2\2\2+.\3\2\2\2,*\3\2\2\2"+
		",-\3\2\2\2-/\3\2\2\2.,\3\2\2\2/\60\7\21\2\2\60\t\3\2\2\2\61\63\7\4\2\2"+
		"\62\64\5\4\3\2\63\62\3\2\2\2\63\64\3\2\2\2\64;\3\2\2\2\65\67\7\5\2\2\66"+
		"\65\3\2\2\2\66\67\3\2\2\2\678\3\2\2\28:\5\4\3\29\66\3\2\2\2:=\3\2\2\2"+
		";9\3\2\2\2;<\3\2\2\2<>\3\2\2\2=;\3\2\2\2>?\7\6\2\2?\13\3\2\2\2@D\7\7\2"+
		"\2AB\5\24\13\2BC\5\4\3\2CE\3\2\2\2DA\3\2\2\2DE\3\2\2\2EN\3\2\2\2FH\7\5"+
		"\2\2GF\3\2\2\2GH\3\2\2\2HI\3\2\2\2IJ\5\24\13\2JK\5\4\3\2KM\3\2\2\2LG\3"+
		"\2\2\2MP\3\2\2\2NL\3\2\2\2NO\3\2\2\2OQ\3\2\2\2PN\3\2\2\2QR\7\b\2\2R\r"+
		"\3\2\2\2SW\7\16\2\2TV\5\22\n\2UT\3\2\2\2VY\3\2\2\2WU\3\2\2\2WX\3\2\2\2"+
		"XZ\3\2\2\2YW\3\2\2\2Z[\7\17\2\2[\17\3\2\2\2\\`\7\20\2\2]_\5\22\n\2^]\3"+
		"\2\2\2_b\3\2\2\2`^\3\2\2\2`a\3\2\2\2ac\3\2\2\2b`\3\2\2\2cd\7\21\2\2d\21"+
		"\3\2\2\2eg\5\24\13\2fe\3\2\2\2fg\3\2\2\2gh\3\2\2\2hi\5\4\3\2i\23\3\2\2"+
		"\2jk\7\22\2\2k\25\3\2\2\2\16\32$,\63\66;DGNW`f";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}