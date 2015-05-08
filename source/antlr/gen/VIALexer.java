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
		T__0=1, T__1=2, T__2=3, T__3=4, T__4=5, T__5=6, NAMED_SYMBOL=7, TEMPLATED_SYMBOL=8, 
		CLOSE=9, INVOKE_SYMBOL=10, CLOSE_INVOKE=11, FIELD_NAME=12, STRING=13, 
		BOOLEAN=14, NUMBER=15, INVALIDNUMBER=16, WS=17, BLOCK_COMMENT=18, LINE_COMMENT=19;
	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	public static final String[] ruleNames = {
		"T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "NAMED_SYMBOL", "TEMPLATED_SYMBOL", 
		"OPEN_TEMPLATE", "CLOSE", "INVOKE_SYMBOL", "OPEN_INVOKE", "CLOSE_INVOKE", 
		"FIELD_NAME", "SYMBOL_CORE", "PERCENT_ESC", "STRING", "ESCAPED_STRING", 
		"ESCAPED_SQ", "ESCAPED_DQ", "ESC", "HEX", "HEX_CAP", "HEX_LC", "VERBATIM_STRING", 
		"VERBATIM_SQ", "VERBATIM_DQ", "BOOLEAN", "NUMBER", "INVALIDNUMBER", "INT", 
		"EXP", "WS", "BLOCK_COMMENT", "LINE_COMMENT"
	};

	private static final String[] _LITERAL_NAMES = {
		null, "'('", "'['", "','", "']'", "'{'", "'}'", null, null, "'>'", null, 
		"')'"
	};
	private static final String[] _SYMBOLIC_NAMES = {
		null, null, null, null, null, null, null, "NAMED_SYMBOL", "TEMPLATED_SYMBOL", 
		"CLOSE", "INVOKE_SYMBOL", "CLOSE_INVOKE", "FIELD_NAME", "STRING", "BOOLEAN", 
		"NUMBER", "INVALIDNUMBER", "WS", "BLOCK_COMMENT", "LINE_COMMENT"
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
		"\3\u0430\ud6d1\u8206\uad2d\u4417\uaef1\u8d80\uaadd\2\25\u014e\b\1\4\2"+
		"\t\2\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4"+
		"\13\t\13\4\f\t\f\4\r\t\r\4\16\t\16\4\17\t\17\4\20\t\20\4\21\t\21\4\22"+
		"\t\22\4\23\t\23\4\24\t\24\4\25\t\25\4\26\t\26\4\27\t\27\4\30\t\30\4\31"+
		"\t\31\4\32\t\32\4\33\t\33\4\34\t\34\4\35\t\35\4\36\t\36\4\37\t\37\4 \t"+
		" \4!\t!\4\"\t\"\4#\t#\4$\t$\3\2\3\2\3\3\3\3\3\4\3\4\3\5\3\5\3\6\3\6\3"+
		"\7\3\7\3\b\3\b\3\t\3\t\3\t\3\n\3\n\3\13\3\13\3\f\3\f\3\f\3\r\3\r\3\16"+
		"\3\16\3\17\3\17\5\17h\n\17\3\17\3\17\3\20\3\20\3\20\5\20o\n\20\3\20\3"+
		"\20\7\20s\n\20\f\20\16\20v\13\20\5\20x\n\20\3\21\3\21\3\21\3\21\3\21\3"+
		"\21\3\21\5\21\u0081\n\21\3\22\3\22\5\22\u0085\n\22\3\23\3\23\5\23\u0089"+
		"\n\23\3\24\3\24\3\24\7\24\u008e\n\24\f\24\16\24\u0091\13\24\3\24\3\24"+
		"\3\25\3\25\3\25\7\25\u0098\n\25\f\25\16\25\u009b\13\25\3\25\3\25\3\26"+
		"\3\26\3\26\3\27\3\27\3\30\3\30\3\31\3\31\3\32\3\32\3\32\5\32\u00ab\n\32"+
		"\3\33\3\33\7\33\u00af\n\33\f\33\16\33\u00b2\13\33\3\33\3\33\3\34\3\34"+
		"\7\34\u00b8\n\34\f\34\16\34\u00bb\13\34\3\34\3\34\3\35\3\35\3\35\3\35"+
		"\3\35\3\35\3\35\3\35\3\35\5\35\u00c8\n\35\3\36\5\36\u00cb\n\36\3\36\3"+
		"\36\3\36\6\36\u00d0\n\36\r\36\16\36\u00d1\3\36\5\36\u00d5\n\36\3\36\5"+
		"\36\u00d8\n\36\3\36\3\36\3\36\3\36\5\36\u00de\n\36\3\36\3\36\3\36\3\36"+
		"\3\36\7\36\u00e5\n\36\f\36\16\36\u00e8\13\36\3\36\7\36\u00eb\n\36\f\36"+
		"\16\36\u00ee\13\36\5\36\u00f0\n\36\3\36\3\36\3\36\3\36\7\36\u00f6\n\36"+
		"\f\36\16\36\u00f9\13\36\3\36\5\36\u00fc\n\36\3\36\3\36\3\36\3\36\3\36"+
		"\3\36\5\36\u0104\n\36\3\36\5\36\u0107\n\36\3\36\3\36\3\36\3\36\3\36\3"+
		"\36\3\36\3\36\3\36\3\36\3\36\5\36\u0114\n\36\5\36\u0116\n\36\3\37\3\37"+
		"\7\37\u011a\n\37\f\37\16\37\u011d\13\37\3 \3 \3 \7 \u0122\n \f \16 \u0125"+
		"\13 \5 \u0127\n \3!\3!\5!\u012b\n!\3!\3!\3\"\6\"\u0130\n\"\r\"\16\"\u0131"+
		"\3\"\3\"\3#\3#\3#\3#\7#\u013a\n#\f#\16#\u013d\13#\3#\3#\3#\3#\3#\3$\3"+
		"$\3$\3$\7$\u0148\n$\f$\16$\u014b\13$\3$\3$\3\u013b\2%\3\3\5\4\7\5\t\6"+
		"\13\7\r\b\17\t\21\n\23\2\25\13\27\f\31\2\33\r\35\16\37\2!\2#\17%\2\'\2"+
		")\2+\2-\2/\2\61\2\63\2\65\2\67\29\20;\21=\22?\2A\2C\23E\24G\25\3\2\23"+
		"\6\2\60\60C\\aac|\7\2\60\60\62;C\\aac|\6\2\f\f\17\17))^^\6\2\f\f\17\17"+
		"$$^^\13\2$$))\61\61^^ddhhppttvv\5\2\62;CHch\4\2\62;CH\4\2\62;ch\3\2))"+
		"\3\2$$\3\2\62;\3\2\62\63\4\2--//\3\2\63;\4\2GGgg\5\2\13\f\17\17\"\"\4"+
		"\2\f\f\17\17\u0167\2\3\3\2\2\2\2\5\3\2\2\2\2\7\3\2\2\2\2\t\3\2\2\2\2\13"+
		"\3\2\2\2\2\r\3\2\2\2\2\17\3\2\2\2\2\21\3\2\2\2\2\25\3\2\2\2\2\27\3\2\2"+
		"\2\2\33\3\2\2\2\2\35\3\2\2\2\2#\3\2\2\2\29\3\2\2\2\2;\3\2\2\2\2=\3\2\2"+
		"\2\2C\3\2\2\2\2E\3\2\2\2\2G\3\2\2\2\3I\3\2\2\2\5K\3\2\2\2\7M\3\2\2\2\t"+
		"O\3\2\2\2\13Q\3\2\2\2\rS\3\2\2\2\17U\3\2\2\2\21W\3\2\2\2\23Z\3\2\2\2\25"+
		"\\\3\2\2\2\27^\3\2\2\2\31a\3\2\2\2\33c\3\2\2\2\35g\3\2\2\2\37w\3\2\2\2"+
		"!y\3\2\2\2#\u0084\3\2\2\2%\u0088\3\2\2\2\'\u008a\3\2\2\2)\u0094\3\2\2"+
		"\2+\u009e\3\2\2\2-\u00a1\3\2\2\2/\u00a3\3\2\2\2\61\u00a5\3\2\2\2\63\u00a7"+
		"\3\2\2\2\65\u00ac\3\2\2\2\67\u00b5\3\2\2\29\u00c7\3\2\2\2;\u0115\3\2\2"+
		"\2=\u0117\3\2\2\2?\u0126\3\2\2\2A\u0128\3\2\2\2C\u012f\3\2\2\2E\u0135"+
		"\3\2\2\2G\u0143\3\2\2\2IJ\7*\2\2J\4\3\2\2\2KL\7]\2\2L\6\3\2\2\2MN\7.\2"+
		"\2N\b\3\2\2\2OP\7_\2\2P\n\3\2\2\2QR\7}\2\2R\f\3\2\2\2ST\7\177\2\2T\16"+
		"\3\2\2\2UV\5\37\20\2V\20\3\2\2\2WX\5\37\20\2XY\5\23\n\2Y\22\3\2\2\2Z["+
		"\7>\2\2[\24\3\2\2\2\\]\7@\2\2]\26\3\2\2\2^_\5\37\20\2_`\5\31\r\2`\30\3"+
		"\2\2\2ab\7*\2\2b\32\3\2\2\2cd\7+\2\2d\34\3\2\2\2eh\5\37\20\2fh\5%\23\2"+
		"ge\3\2\2\2gf\3\2\2\2hi\3\2\2\2ij\7<\2\2j\36\3\2\2\2kx\7,\2\2lo\5!\21\2"+
		"mo\t\2\2\2nl\3\2\2\2nm\3\2\2\2ot\3\2\2\2ps\5!\21\2qs\t\3\2\2rp\3\2\2\2"+
		"rq\3\2\2\2sv\3\2\2\2tr\3\2\2\2tu\3\2\2\2ux\3\2\2\2vt\3\2\2\2wk\3\2\2\2"+
		"wn\3\2\2\2x \3\2\2\2y\u0080\7\'\2\2z{\5/\30\2{|\5/\30\2|\u0081\3\2\2\2"+
		"}~\5\61\31\2~\177\5\61\31\2\177\u0081\3\2\2\2\u0080z\3\2\2\2\u0080}\3"+
		"\2\2\2\u0081\"\3\2\2\2\u0082\u0085\5%\23\2\u0083\u0085\5\63\32\2\u0084"+
		"\u0082\3\2\2\2\u0084\u0083\3\2\2\2\u0085$\3\2\2\2\u0086\u0089\5\'\24\2"+
		"\u0087\u0089\5)\25\2\u0088\u0086\3\2\2\2\u0088\u0087\3\2\2\2\u0089&\3"+
		"\2\2\2\u008a\u008f\7)\2\2\u008b\u008e\5+\26\2\u008c\u008e\n\4\2\2\u008d"+
		"\u008b\3\2\2\2\u008d\u008c\3\2\2\2\u008e\u0091\3\2\2\2\u008f\u008d\3\2"+
		"\2\2\u008f\u0090\3\2\2\2\u0090\u0092\3\2\2\2\u0091\u008f\3\2\2\2\u0092"+
		"\u0093\7)\2\2\u0093(\3\2\2\2\u0094\u0099\7$\2\2\u0095\u0098\5+\26\2\u0096"+
		"\u0098\n\5\2\2\u0097\u0095\3\2\2\2\u0097\u0096\3\2\2\2\u0098\u009b\3\2"+
		"\2\2\u0099\u0097\3\2\2\2\u0099\u009a\3\2\2\2\u009a\u009c\3\2\2\2\u009b"+
		"\u0099\3\2\2\2\u009c\u009d\7$\2\2\u009d*\3\2\2\2\u009e\u009f\7^\2\2\u009f"+
		"\u00a0\t\6\2\2\u00a0,\3\2\2\2\u00a1\u00a2\t\7\2\2\u00a2.\3\2\2\2\u00a3"+
		"\u00a4\t\b\2\2\u00a4\60\3\2\2\2\u00a5\u00a6\t\t\2\2\u00a6\62\3\2\2\2\u00a7"+
		"\u00aa\7B\2\2\u00a8\u00ab\5\65\33\2\u00a9\u00ab\5\67\34\2\u00aa\u00a8"+
		"\3\2\2\2\u00aa\u00a9\3\2\2\2\u00ab\64\3\2\2\2\u00ac\u00b0\7)\2\2\u00ad"+
		"\u00af\n\n\2\2\u00ae\u00ad\3\2\2\2\u00af\u00b2\3\2\2\2\u00b0\u00ae\3\2"+
		"\2\2\u00b0\u00b1\3\2\2\2\u00b1\u00b3\3\2\2\2\u00b2\u00b0\3\2\2\2\u00b3"+
		"\u00b4\7)\2\2\u00b4\66\3\2\2\2\u00b5\u00b9\7$\2\2\u00b6\u00b8\n\13\2\2"+
		"\u00b7\u00b6\3\2\2\2\u00b8\u00bb\3\2\2\2\u00b9\u00b7\3\2\2\2\u00b9\u00ba"+
		"\3\2\2\2\u00ba\u00bc\3\2\2\2\u00bb\u00b9\3\2\2\2\u00bc\u00bd\7$\2\2\u00bd"+
		"8\3\2\2\2\u00be\u00bf\7v\2\2\u00bf\u00c0\7t\2\2\u00c0\u00c1\7w\2\2\u00c1"+
		"\u00c8\7g\2\2\u00c2\u00c3\7h\2\2\u00c3\u00c4\7c\2\2\u00c4\u00c5\7n\2\2"+
		"\u00c5\u00c6\7u\2\2\u00c6\u00c8\7g\2\2\u00c7\u00be\3\2\2\2\u00c7\u00c2"+
		"\3\2\2\2\u00c8:\3\2\2\2\u00c9\u00cb\7/\2\2\u00ca\u00c9\3\2\2\2\u00ca\u00cb"+
		"\3\2\2\2\u00cb\u00cc\3\2\2\2\u00cc\u00cd\5? \2\u00cd\u00cf\7\60\2\2\u00ce"+
		"\u00d0\t\f\2\2\u00cf\u00ce\3\2\2\2\u00d0\u00d1\3\2\2\2\u00d1\u00cf\3\2"+
		"\2\2\u00d1\u00d2\3\2\2\2\u00d2\u00d4\3\2\2\2\u00d3\u00d5\5A!\2\u00d4\u00d3"+
		"\3\2\2\2\u00d4\u00d5\3\2\2\2\u00d5\u0116\3\2\2\2\u00d6\u00d8\7/\2\2\u00d7"+
		"\u00d6\3\2\2\2\u00d7\u00d8\3\2\2\2\u00d8\u00d9\3\2\2\2\u00d9\u00da\5?"+
		" \2\u00da\u00db\5A!\2\u00db\u0116\3\2\2\2\u00dc\u00de\7/\2\2\u00dd\u00dc"+
		"\3\2\2\2\u00dd\u00de\3\2\2\2\u00de\u00df\3\2\2\2\u00df\u0116\5? \2\u00e0"+
		"\u00e1\7\62\2\2\u00e1\u00e2\7z\2\2\u00e2\u00ef\3\2\2\2\u00e3\u00e5\5\61"+
		"\31\2\u00e4\u00e3\3\2\2\2\u00e5\u00e8\3\2\2\2\u00e6\u00e4\3\2\2\2\u00e6"+
		"\u00e7\3\2\2\2\u00e7\u00f0\3\2\2\2\u00e8\u00e6\3\2\2\2\u00e9\u00eb\5/"+
		"\30\2\u00ea\u00e9\3\2\2\2\u00eb\u00ee\3\2\2\2\u00ec\u00ea\3\2\2\2\u00ec"+
		"\u00ed\3\2\2\2\u00ed\u00f0\3\2\2\2\u00ee\u00ec\3\2\2\2\u00ef\u00e6\3\2"+
		"\2\2\u00ef\u00ec\3\2\2\2\u00f0\u0116\3\2\2\2\u00f1\u00f2\7\62\2\2\u00f2"+
		"\u00f3\7d\2\2\u00f3\u00f7\3\2\2\2\u00f4\u00f6\t\r\2\2\u00f5\u00f4\3\2"+
		"\2\2\u00f6\u00f9\3\2\2\2\u00f7\u00f5\3\2\2\2\u00f7\u00f8\3\2\2\2\u00f8"+
		"\u0116\3\2\2\2\u00f9\u00f7\3\2\2\2\u00fa\u00fc\t\16\2\2\u00fb\u00fa\3"+
		"\2\2\2\u00fb\u00fc\3\2\2\2\u00fc\u0103\3\2\2\2\u00fd\u00fe\7p\2\2\u00fe"+
		"\u00ff\7c\2\2\u00ff\u0104\7p\2\2\u0100\u0101\7P\2\2\u0101\u0102\7c\2\2"+
		"\u0102\u0104\7P\2\2\u0103\u00fd\3\2\2\2\u0103\u0100\3\2\2\2\u0104\u0116"+
		"\3\2\2\2\u0105\u0107\t\16\2\2\u0106\u0105\3\2\2\2\u0106\u0107\3\2\2\2"+
		"\u0107\u0113\3\2\2\2\u0108\u0109\7k\2\2\u0109\u010a\7p\2\2\u010a\u0114"+
		"\7h\2\2\u010b\u010c\7K\2\2\u010c\u010d\7p\2\2\u010d\u010e\7h\2\2\u010e"+
		"\u010f\7k\2\2\u010f\u0110\7p\2\2\u0110\u0111\7k\2\2\u0111\u0112\7v\2\2"+
		"\u0112\u0114\7{\2\2\u0113\u0108\3\2\2\2\u0113\u010b\3\2\2\2\u0114\u0116"+
		"\3\2\2\2\u0115\u00ca\3\2\2\2\u0115\u00d7\3\2\2\2\u0115\u00dd\3\2\2\2\u0115"+
		"\u00e0\3\2\2\2\u0115\u00f1\3\2\2\2\u0115\u00fb\3\2\2\2\u0115\u0106\3\2"+
		"\2\2\u0116<\3\2\2\2\u0117\u011b\5;\36\2\u0118\u011a\t\3\2\2\u0119\u0118"+
		"\3\2\2\2\u011a\u011d\3\2\2\2\u011b\u0119\3\2\2\2\u011b\u011c\3\2\2\2\u011c"+
		">\3\2\2\2\u011d\u011b\3\2\2\2\u011e\u0127\7\62\2\2\u011f\u0123\t\17\2"+
		"\2\u0120\u0122\t\f\2\2\u0121\u0120\3\2\2\2\u0122\u0125\3\2\2\2\u0123\u0121"+
		"\3\2\2\2\u0123\u0124\3\2\2\2\u0124\u0127\3\2\2\2\u0125\u0123\3\2\2\2\u0126"+
		"\u011e\3\2\2\2\u0126\u011f\3\2\2\2\u0127@\3\2\2\2\u0128\u012a\t\20\2\2"+
		"\u0129\u012b\t\16\2\2\u012a\u0129\3\2\2\2\u012a\u012b\3\2\2\2\u012b\u012c"+
		"\3\2\2\2\u012c\u012d\5? \2\u012dB\3\2\2\2\u012e\u0130\t\21\2\2\u012f\u012e"+
		"\3\2\2\2\u0130\u0131\3\2\2\2\u0131\u012f\3\2\2\2\u0131\u0132\3\2\2\2\u0132"+
		"\u0133\3\2\2\2\u0133\u0134\b\"\2\2\u0134D\3\2\2\2\u0135\u0136\7\61\2\2"+
		"\u0136\u0137\7,\2\2\u0137\u013b\3\2\2\2\u0138\u013a\13\2\2\2\u0139\u0138"+
		"\3\2\2\2\u013a\u013d\3\2\2\2\u013b\u013c\3\2\2\2\u013b\u0139\3\2\2\2\u013c"+
		"\u013e\3\2\2\2\u013d\u013b\3\2\2\2\u013e\u013f\7,\2\2\u013f\u0140\7\61"+
		"\2\2\u0140\u0141\3\2\2\2\u0141\u0142\b#\2\2\u0142F\3\2\2\2\u0143\u0144"+
		"\7\61\2\2\u0144\u0145\7\61\2\2\u0145\u0149\3\2\2\2\u0146\u0148\n\22\2"+
		"\2\u0147\u0146\3\2\2\2\u0148\u014b\3\2\2\2\u0149\u0147\3\2\2\2\u0149\u014a"+
		"\3\2\2\2\u014a\u014c\3\2\2\2\u014b\u0149\3\2\2\2\u014c\u014d\b$\2\2\u014d"+
		"H\3\2\2\2(\2gnrtw\u0080\u0084\u0088\u008d\u008f\u0097\u0099\u00aa\u00b0"+
		"\u00b9\u00c7\u00ca\u00d1\u00d4\u00d7\u00dd\u00e6\u00ec\u00ef\u00f7\u00fb"+
		"\u0103\u0106\u0113\u0115\u011b\u0123\u0126\u012a\u0131\u013b\u0149\3\b"+
		"\2\2";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}