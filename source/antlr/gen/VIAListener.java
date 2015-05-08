// Generated from /Users/paulaustin/repos/NI_VireoSDK/source/antlr/VIA.g4 by ANTLR 4.5
import org.antlr.v4.runtime.misc.NotNull;
import org.antlr.v4.runtime.tree.ParseTreeListener;

/**
 * This interface defines a complete listener for a parse tree produced by
 * {@link VIAParser}.
 */
public interface VIAListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by {@link VIAParser#viaStream}.
	 * @param ctx the parse tree
	 */
	void enterViaStream(@NotNull VIAParser.ViaStreamContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#viaStream}.
	 * @param ctx the parse tree
	 */
	void exitViaStream(@NotNull VIAParser.ViaStreamContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#symbol}.
	 * @param ctx the parse tree
	 */
	void enterSymbol(@NotNull VIAParser.SymbolContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#symbol}.
	 * @param ctx the parse tree
	 */
	void exitSymbol(@NotNull VIAParser.SymbolContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#literal}.
	 * @param ctx the parse tree
	 */
	void enterLiteral(@NotNull VIAParser.LiteralContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#literal}.
	 * @param ctx the parse tree
	 */
	void exitLiteral(@NotNull VIAParser.LiteralContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#viaCollection}.
	 * @param ctx the parse tree
	 */
	void enterViaCollection(@NotNull VIAParser.ViaCollectionContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#viaCollection}.
	 * @param ctx the parse tree
	 */
	void exitViaCollection(@NotNull VIAParser.ViaCollectionContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#jsonishArray}.
	 * @param ctx the parse tree
	 */
	void enterJsonishArray(@NotNull VIAParser.JsonishArrayContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#jsonishArray}.
	 * @param ctx the parse tree
	 */
	void exitJsonishArray(@NotNull VIAParser.JsonishArrayContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#jsonishCluster}.
	 * @param ctx the parse tree
	 */
	void enterJsonishCluster(@NotNull VIAParser.JsonishClusterContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#jsonishCluster}.
	 * @param ctx the parse tree
	 */
	void exitJsonishCluster(@NotNull VIAParser.JsonishClusterContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#temaplate}.
	 * @param ctx the parse tree
	 */
	void enterTemaplate(@NotNull VIAParser.TemaplateContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#temaplate}.
	 * @param ctx the parse tree
	 */
	void exitTemaplate(@NotNull VIAParser.TemaplateContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#invoke}.
	 * @param ctx the parse tree
	 */
	void enterInvoke(@NotNull VIAParser.InvokeContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#invoke}.
	 * @param ctx the parse tree
	 */
	void exitInvoke(@NotNull VIAParser.InvokeContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#element}.
	 * @param ctx the parse tree
	 */
	void enterElement(@NotNull VIAParser.ElementContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#element}.
	 * @param ctx the parse tree
	 */
	void exitElement(@NotNull VIAParser.ElementContext ctx);
	/**
	 * Enter a parse tree produced by {@link VIAParser#fieldName}.
	 * @param ctx the parse tree
	 */
	void enterFieldName(@NotNull VIAParser.FieldNameContext ctx);
	/**
	 * Exit a parse tree produced by {@link VIAParser#fieldName}.
	 * @param ctx the parse tree
	 */
	void exitFieldName(@NotNull VIAParser.FieldNameContext ctx);
}