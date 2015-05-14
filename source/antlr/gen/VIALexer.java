// Generated from /Users/paulaustin/repos/NI_VireoSDK/source/antlr/VIA.g4 by ANTLR 4.5
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.misc.*;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class VIALexer extends Lexer {
	static { RuntimeMetaData.checkVersion("4.5", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		T__0=1, T__1=2, T__2=3, T__3=4, T__4=5, T__5=6, STRING=7, BOOLEAN=8, NUMBER=9, 
		INVALID_NUMBER=10, SIMPLE_SYMBOL=11, TEMPLATED_SYMBOL=12, CLOSE_TEMPLATE=13, 
		INVOKE_SYMBOL=14, CLOSE_INVOKE=15, FIELD_NAME=16, WS=17, BLOCK_COMMENT=18, 
		LINE_COMMENT=19;
	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	public static final String[] ruleNames = {
		"T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "STRING", "ESCAPED_STRING", 
		"ESCAPED_SQ", "ESCAPED_DQ", "ESC", "HEX", "HEX_CAP", "HEX_LC", "VERBATIM_STRING", 
		"VERBATIM_SQ", "VERBATIM_DQ", "BOOLEAN", "NUMBER", "INT", "EXP", "INFINITY", 
		"NOT_A_NUMBER", "INVALID_NUMBER", "SIMPLE_SYMBOL", "TEMPLATED_SYMBOL", 
		"OPEN_TEMPLATE", "CLOSE_TEMPLATE", "INVOKE_SYMBOL", "OPEN_INVOKE", "CLOSE_INVOKE", 
		"FIELD_NAME", "SYMBOL_CORE", "SYMBOL_VERBATIM", "PERCENT_ESC", "WS", "BLOCK_COMMENT", 
		"LINE_COMMENT"
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


	public VIALexer(CharStream input) {
		super(input);
		_interp = new LexerATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@Override
	public String getGrammarFileName() { return "VIA.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public String[] getModeNames() { return modeNames; }

	@Override
	public ATN getATN() { return _ATN; }

	public static final String _serializedATN =
		"\3\u0430\ud6d1\u8206\uad2d\u4417\uaef1\u8d80\uaadd\2\25\u0163\b\1\4\2"+
		"\t\2\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4"+
		"\13\t\13\4\f\t\f\4\r\t\r\4\16\t\16\4\17\t\17\4\20\t\20\4\21\t\21\4\22"+
		"\t\22\4\23\t\23\4\24\t\24\4\25\t\25\4\26\t\26\4\27\t\27\4\30\t\30\4\31"+
		"\t\31\4\32\t\32\4\33\t\33\4\34\t\34\4\35\t\35\4\36\t\36\4\37\t\37\4 \t"+
		" \4!\t!\4\"\t\"\4#\t#\4$\t$\4%\t%\4&\t&\4\'\t\'\3\2\3\2\3\3\3\3\3\4\3"+
		"\4\3\5\3\5\3\6\3\6\3\7\3\7\3\b\3\b\5\b^\n\b\3\t\3\t\5\tb\n\t\3\n\3\n\3"+
		"\n\7\ng\n\n\f\n\16\nj\13\n\3\n\3\n\3\13\3\13\3\13\7\13q\n\13\f\13\16\13"+
		"t\13\13\3\13\3\13\3\f\3\f\3\f\3\r\3\r\3\16\3\16\3\17\3\17\3\20\3\20\3"+
		"\20\5\20\u0084\n\20\3\21\3\21\7\21\u0088\n\21\f\21\16\21\u008b\13\21\3"+
		"\21\3\21\3\22\3\22\7\22\u0091\n\22\f\22\16\22\u0094\13\22\3\22\3\22\3"+
		"\23\3\23\3\23\3\23\3\23\3\23\3\23\3\23\3\23\5\23\u00a1\n\23\3\24\5\24"+
		"\u00a4\n\24\3\24\3\24\3\24\6\24\u00a9\n\24\r\24\16\24\u00aa\3\24\5\24"+
		"\u00ae\n\24\3\24\5\24\u00b1\n\24\3\24\3\24\3\24\3\24\5\24\u00b7\n\24\3"+
		"\24\3\24\3\24\3\24\3\24\7\24\u00be\n\24\f\24\16\24\u00c1\13\24\3\24\7"+
		"\24\u00c4\n\24\f\24\16\24\u00c7\13\24\5\24\u00c9\n\24\3\24\3\24\3\24\3"+
		"\24\7\24\u00cf\n\24\f\24\16\24\u00d2\13\24\3\24\5\24\u00d5\n\24\3\24\3"+
		"\24\5\24\u00d9\n\24\3\24\5\24\u00dc\n\24\3\25\3\25\3\25\7\25\u00e1\n\25"+
		"\f\25\16\25\u00e4\13\25\5\25\u00e6\n\25\3\26\3\26\5\26\u00ea\n\26\3\26"+
		"\3\26\3\27\3\27\3\27\3\27\3\27\3\27\3\27\3\27\3\27\3\27\3\27\5\27\u00f9"+
		"\n\27\3\30\3\30\3\30\3\30\3\30\3\30\5\30\u0101\n\30\3\31\3\31\7\31\u0105"+
		"\n\31\f\31\16\31\u0108\13\31\3\32\3\32\5\32\u010c\n\32\3\33\3\33\3\33"+
		"\3\34\3\34\3\35\3\35\3\36\3\36\3\36\3\37\3\37\3 \3 \3!\3!\5!\u011e\n!"+
		"\3!\3!\3\"\3\"\3\"\5\"\u0125\n\"\3\"\3\"\7\"\u0129\n\"\f\"\16\"\u012c"+
		"\13\"\5\"\u012e\n\"\3#\3#\3#\3#\7#\u0134\n#\f#\16#\u0137\13#\3#\3#\3$"+
		"\3$\3$\3$\3$\3$\3$\5$\u0142\n$\3%\6%\u0145\n%\r%\16%\u0146\3%\3%\3&\3"+
		"&\3&\3&\7&\u014f\n&\f&\16&\u0152\13&\3&\3&\3&\3&\3&\3\'\3\'\3\'\3\'\7"+
		"\'\u015d\n\'\f\'\16\'\u0160\13\'\3\'\3\'\3\u0150\2(\3\3\5\4\7\5\t\6\13"+
		"\7\r\b\17\t\21\2\23\2\25\2\27\2\31\2\33\2\35\2\37\2!\2#\2%\n\'\13)\2+"+
		"\2-\2/\2\61\f\63\r\65\16\67\29\17;\20=\2?\21A\22C\2E\2G\2I\23K\24M\25"+
		"\3\2\24\6\2\f\f\17\17))^^\6\2\f\f\17\17$$^^\13\2$$))\61\61^^ddhhppttv"+
		"v\5\2\62;CHch\4\2\62;CH\4\2\62;ch\3\2))\3\2$$\3\2\62;\3\2\62\63\4\2--"+
		"//\3\2\63;\4\2GGgg\7\2\60\60\62;C\\aac|\6\2\60\60C\\aac|\3\2~~\5\2\13"+
		"\f\17\17\"\"\4\2\f\f\17\17\u017c\2\3\3\2\2\2\2\5\3\2\2\2\2\7\3\2\2\2\2"+
		"\t\3\2\2\2\2\13\3\2\2\2\2\r\3\2\2\2\2\17\3\2\2\2\2%\3\2\2\2\2\'\3\2\2"+
		"\2\2\61\3\2\2\2\2\63\3\2\2\2\2\65\3\2\2\2\29\3\2\2\2\2;\3\2\2\2\2?\3\2"+
		"\2\2\2A\3\2\2\2\2I\3\2\2\2\2K\3\2\2\2\2M\3\2\2\2\3O\3\2\2\2\5Q\3\2\2\2"+
		"\7S\3\2\2\2\tU\3\2\2\2\13W\3\2\2\2\rY\3\2\2\2\17]\3\2\2\2\21a\3\2\2\2"+
		"\23c\3\2\2\2\25m\3\2\2\2\27w\3\2\2\2\31z\3\2\2\2\33|\3\2\2\2\35~\3\2\2"+
		"\2\37\u0080\3\2\2\2!\u0085\3\2\2\2#\u008e\3\2\2\2%\u00a0\3\2\2\2\'\u00db"+
		"\3\2\2\2)\u00e5\3\2\2\2+\u00e7\3\2\2\2-\u00f8\3\2\2\2/\u0100\3\2\2\2\61"+
		"\u0102\3\2\2\2\63\u010b\3\2\2\2\65\u010d\3\2\2\2\67\u0110\3\2\2\29\u0112"+
		"\3\2\2\2;\u0114\3\2\2\2=\u0117\3\2\2\2?\u0119\3\2\2\2A\u011d\3\2\2\2C"+
		"\u012d\3\2\2\2E\u012f\3\2\2\2G\u013a\3\2\2\2I\u0144\3\2\2\2K\u014a\3\2"+
		"\2\2M\u0158\3\2\2\2OP\7*\2\2P\4\3\2\2\2QR\7]\2\2R\6\3\2\2\2ST\7.\2\2T"+
		"\b\3\2\2\2UV\7_\2\2V\n\3\2\2\2WX\7}\2\2X\f\3\2\2\2YZ\7\177\2\2Z\16\3\2"+
		"\2\2[^\5\21\t\2\\^\5\37\20\2][\3\2\2\2]\\\3\2\2\2^\20\3\2\2\2_b\5\23\n"+
		"\2`b\5\25\13\2a_\3\2\2\2a`\3\2\2\2b\22\3\2\2\2ch\7)\2\2dg\5\27\f\2eg\n"+
		"\2\2\2fd\3\2\2\2fe\3\2\2\2gj\3\2\2\2hf\3\2\2\2hi\3\2\2\2ik\3\2\2\2jh\3"+
		"\2\2\2kl\7)\2\2l\24\3\2\2\2mr\7$\2\2nq\5\27\f\2oq\n\3\2\2pn\3\2\2\2po"+
		"\3\2\2\2qt\3\2\2\2rp\3\2\2\2rs\3\2\2\2su\3\2\2\2tr\3\2\2\2uv\7$\2\2v\26"+
		"\3\2\2\2wx\7^\2\2xy\t\4\2\2y\30\3\2\2\2z{\t\5\2\2{\32\3\2\2\2|}\t\6\2"+
		"\2}\34\3\2\2\2~\177\t\7\2\2\177\36\3\2\2\2\u0080\u0083\7B\2\2\u0081\u0084"+
		"\5!\21\2\u0082\u0084\5#\22\2\u0083\u0081\3\2\2\2\u0083\u0082\3\2\2\2\u0084"+
		" \3\2\2\2\u0085\u0089\7)\2\2\u0086\u0088\n\b\2\2\u0087\u0086\3\2\2\2\u0088"+
		"\u008b\3\2\2\2\u0089\u0087\3\2\2\2\u0089\u008a\3\2\2\2\u008a\u008c\3\2"+
		"\2\2\u008b\u0089\3\2\2\2\u008c\u008d\7)\2\2\u008d\"\3\2\2\2\u008e\u0092"+
		"\7$\2\2\u008f\u0091\n\t\2\2\u0090\u008f\3\2\2\2\u0091\u0094\3\2\2\2\u0092"+
		"\u0090\3\2\2\2\u0092\u0093\3\2\2\2\u0093\u0095\3\2\2\2\u0094\u0092\3\2"+
		"\2\2\u0095\u0096\7$\2\2\u0096$\3\2\2\2\u0097\u0098\7v\2\2\u0098\u0099"+
		"\7t\2\2\u0099\u009a\7w\2\2\u009a\u00a1\7g\2\2\u009b\u009c\7h\2\2\u009c"+
		"\u009d\7c\2\2\u009d\u009e\7n\2\2\u009e\u009f\7u\2\2\u009f\u00a1\7g\2\2"+
		"\u00a0\u0097\3\2\2\2\u00a0\u009b\3\2\2\2\u00a1&\3\2\2\2\u00a2\u00a4\7"+
		"/\2\2\u00a3\u00a2\3\2\2\2\u00a3\u00a4\3\2\2\2\u00a4\u00a5\3\2\2\2\u00a5"+
		"\u00a6\5)\25\2\u00a6\u00a8\7\60\2\2\u00a7\u00a9\t\n\2\2\u00a8\u00a7\3"+
		"\2\2\2\u00a9\u00aa\3\2\2\2\u00aa\u00a8\3\2\2\2\u00aa\u00ab\3\2\2\2\u00ab"+
		"\u00ad\3\2\2\2\u00ac\u00ae\5+\26\2\u00ad\u00ac\3\2\2\2\u00ad\u00ae\3\2"+
		"\2\2\u00ae\u00dc\3\2\2\2\u00af\u00b1\7/\2\2\u00b0\u00af\3\2\2\2\u00b0"+
		"\u00b1\3\2\2\2\u00b1\u00b2\3\2\2\2\u00b2\u00b3\5)\25\2\u00b3\u00b4\5+"+
		"\26\2\u00b4\u00dc\3\2\2\2\u00b5\u00b7\7/\2\2\u00b6\u00b5\3\2\2\2\u00b6"+
		"\u00b7\3\2\2\2\u00b7\u00b8\3\2\2\2\u00b8\u00dc\5)\25\2\u00b9\u00ba\7\62"+
		"\2\2\u00ba\u00bb\7z\2\2\u00bb\u00c8\3\2\2\2\u00bc\u00be\5\35\17\2\u00bd"+
		"\u00bc\3\2\2\2\u00be\u00c1\3\2\2\2\u00bf\u00bd\3\2\2\2\u00bf\u00c0\3\2"+
		"\2\2\u00c0\u00c9\3\2\2\2\u00c1\u00bf\3\2\2\2\u00c2\u00c4\5\33\16\2\u00c3"+
		"\u00c2\3\2\2\2\u00c4\u00c7\3\2\2\2\u00c5\u00c3\3\2\2\2\u00c5\u00c6\3\2"+
		"\2\2\u00c6\u00c9\3\2\2\2\u00c7\u00c5\3\2\2\2\u00c8\u00bf\3\2\2\2\u00c8"+
		"\u00c5\3\2\2\2\u00c9\u00dc\3\2\2\2\u00ca\u00cb\7\62\2\2\u00cb\u00cc\7"+
		"d\2\2\u00cc\u00d0\3\2\2\2\u00cd\u00cf\t\13\2\2\u00ce\u00cd\3\2\2\2\u00cf"+
		"\u00d2\3\2\2\2\u00d0\u00ce\3\2\2\2\u00d0\u00d1\3\2\2\2\u00d1\u00dc\3\2"+
		"\2\2\u00d2\u00d0\3\2\2\2\u00d3\u00d5\t\f\2\2\u00d4\u00d3\3\2\2\2\u00d4"+
		"\u00d5\3\2\2\2\u00d5\u00d6\3\2\2\2\u00d6\u00dc\5/\30\2\u00d7\u00d9\t\f"+
		"\2\2\u00d8\u00d7\3\2\2\2\u00d8\u00d9\3\2\2\2\u00d9\u00da\3\2\2\2\u00da"+
		"\u00dc\5-\27\2\u00db\u00a3\3\2\2\2\u00db\u00b0\3\2\2\2\u00db\u00b6\3\2"+
		"\2\2\u00db\u00b9\3\2\2\2\u00db\u00ca\3\2\2\2\u00db\u00d4\3\2\2\2\u00db"+
		"\u00d8\3\2\2\2\u00dc(\3\2\2\2\u00dd\u00e6\7\62\2\2\u00de\u00e2\t\r\2\2"+
		"\u00df\u00e1\t\n\2\2\u00e0\u00df\3\2\2\2\u00e1\u00e4\3\2\2\2\u00e2\u00e0"+
		"\3\2\2\2\u00e2\u00e3\3\2\2\2\u00e3\u00e6\3\2\2\2\u00e4\u00e2\3\2\2\2\u00e5"+
		"\u00dd\3\2\2\2\u00e5\u00de\3\2\2\2\u00e6*\3\2\2\2\u00e7\u00e9\t\16\2\2"+
		"\u00e8\u00ea\t\f\2\2\u00e9\u00e8\3\2\2\2\u00e9\u00ea\3\2\2\2\u00ea\u00eb"+
		"\3\2\2\2\u00eb\u00ec\5)\25\2\u00ec,\3\2\2\2\u00ed\u00ee\7k\2\2\u00ee\u00ef"+
		"\7p\2\2\u00ef\u00f9\7h\2\2\u00f0\u00f1\7K\2\2\u00f1\u00f2\7p\2\2\u00f2"+
		"\u00f3\7h\2\2\u00f3\u00f4\7k\2\2\u00f4\u00f5\7p\2\2\u00f5\u00f6\7k\2\2"+
		"\u00f6\u00f7\7v\2\2\u00f7\u00f9\7{\2\2\u00f8\u00ed\3\2\2\2\u00f8\u00f0"+
		"\3\2\2\2\u00f9.\3\2\2\2\u00fa\u00fb\7p\2\2\u00fb\u00fc\7c\2\2\u00fc\u0101"+
		"\7p\2\2\u00fd\u00fe\7P\2\2\u00fe\u00ff\7c\2\2\u00ff\u0101\7P\2\2\u0100"+
		"\u00fa\3\2\2\2\u0100\u00fd\3\2\2\2\u0101\60\3\2\2\2\u0102\u0106\5\'\24"+
		"\2\u0103\u0105\t\17\2\2\u0104\u0103\3\2\2\2\u0105\u0108\3\2\2\2\u0106"+
		"\u0104\3\2\2\2\u0106\u0107\3\2\2\2\u0107\62\3\2\2\2\u0108\u0106\3\2\2"+
		"\2\u0109\u010c\5C\"\2\u010a\u010c\5E#\2\u010b\u0109\3\2\2\2\u010b\u010a"+
		"\3\2\2\2\u010c\64\3\2\2\2\u010d\u010e\5C\"\2\u010e\u010f\5\67\34\2\u010f"+
		"\66\3\2\2\2\u0110\u0111\7>\2\2\u01118\3\2\2\2\u0112\u0113\7@\2\2\u0113"+
		":\3\2\2\2\u0114\u0115\5C\"\2\u0115\u0116\5=\37\2\u0116<\3\2\2\2\u0117"+
		"\u0118\7*\2\2\u0118>\3\2\2\2\u0119\u011a\7+\2\2\u011a@\3\2\2\2\u011b\u011e"+
		"\5C\"\2\u011c\u011e\5\21\t\2\u011d\u011b\3\2\2\2\u011d\u011c\3\2\2\2\u011e"+
		"\u011f\3\2\2\2\u011f\u0120\7<\2\2\u0120B\3\2\2\2\u0121\u012e\7,\2\2\u0122"+
		"\u0125\5G$\2\u0123\u0125\t\20\2\2\u0124\u0122\3\2\2\2\u0124\u0123\3\2"+
		"\2\2\u0125\u012a\3\2\2\2\u0126\u0129\5G$\2\u0127\u0129\t\17\2\2\u0128"+
		"\u0126\3\2\2\2\u0128\u0127\3\2\2\2\u0129\u012c\3\2\2\2\u012a\u0128\3\2"+
		"\2\2\u012a\u012b\3\2\2\2\u012b\u012e\3\2\2\2\u012c\u012a\3\2\2\2\u012d"+
		"\u0121\3\2\2\2\u012d\u0124\3\2\2\2\u012eD\3\2\2\2\u012f\u0135\7~\2\2\u0130"+
		"\u0131\7^\2\2\u0131\u0134\7^\2\2\u0132\u0134\n\21\2\2\u0133\u0130\3\2"+
		"\2\2\u0133\u0132\3\2\2\2\u0134\u0137\3\2\2\2\u0135\u0133\3\2\2\2\u0135"+
		"\u0136\3\2\2\2\u0136\u0138\3\2\2\2\u0137\u0135\3\2\2\2\u0138\u0139\7~"+
		"\2\2\u0139F\3\2\2\2\u013a\u0141\7\'\2\2\u013b\u013c\5\33\16\2\u013c\u013d"+
		"\5\33\16\2\u013d\u0142\3\2\2\2\u013e\u013f\5\35\17\2\u013f\u0140\5\35"+
		"\17\2\u0140\u0142\3\2\2\2\u0141\u013b\3\2\2\2\u0141\u013e\3\2\2\2\u0142"+
		"H\3\2\2\2\u0143\u0145\t\22\2\2\u0144\u0143\3\2\2\2\u0145\u0146\3\2\2\2"+
		"\u0146\u0144\3\2\2\2\u0146\u0147\3\2\2\2\u0147\u0148\3\2\2\2\u0148\u0149"+
		"\b%\2\2\u0149J\3\2\2\2\u014a\u014b\7\61\2\2\u014b\u014c\7,\2\2\u014c\u0150"+
		"\3\2\2\2\u014d\u014f\13\2\2\2\u014e\u014d\3\2\2\2\u014f\u0152\3\2\2\2"+
		"\u0150\u0151\3\2\2\2\u0150\u014e\3\2\2\2\u0151\u0153\3\2\2\2\u0152\u0150"+
		"\3\2\2\2\u0153\u0154\7,\2\2\u0154\u0155\7\61\2\2\u0155\u0156\3\2\2\2\u0156"+
		"\u0157\b&\2\2\u0157L\3\2\2\2\u0158\u0159\7\61\2\2\u0159\u015a\7\61\2\2"+
		"\u015a\u015e\3\2\2\2\u015b\u015d\n\23\2\2\u015c\u015b\3\2\2\2\u015d\u0160"+
		"\3\2\2\2\u015e\u015c\3\2\2\2\u015e\u015f\3\2\2\2\u015f\u0161\3\2\2\2\u0160"+
		"\u015e\3\2\2\2\u0161\u0162\b\'\2\2\u0162N\3\2\2\2+\2]afhpr\u0083\u0089"+
		"\u0092\u00a0\u00a3\u00aa\u00ad\u00b0\u00b6\u00bf\u00c5\u00c8\u00d0\u00d4"+
		"\u00d8\u00db\u00e2\u00e5\u00e9\u00f8\u0100\u0106\u010b\u011d\u0124\u0128"+
		"\u012a\u012d\u0133\u0135\u0141\u0146\u0150\u015e\3\b\2\2";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}