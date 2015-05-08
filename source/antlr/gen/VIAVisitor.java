// Generated from /Users/paulaustin/repos/NI_VireoSDK/source/antlr/VIA.g4 by ANTLR 4.5
import org.antlr.v4.runtime.misc.NotNull;
import org.antlr.v4.runtime.tree.ParseTreeVisitor;

/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by {@link VIAParser}.
 *
 * @param <T> The return type of the visit operation. Use {@link Void} for
 * operations with no return type.
 */
public interface VIAVisitor<T> extends ParseTreeVisitor<T> {
	/**
	 * Visit a parse tree produced by {@link VIAParser#viaStream}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitViaStream(@NotNull VIAParser.ViaStreamContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#symbol}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitSymbol(@NotNull VIAParser.SymbolContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#literal}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitLiteral(@NotNull VIAParser.LiteralContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#viaCollection}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitViaCollection(@NotNull VIAParser.ViaCollectionContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#jsonishArray}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitJsonishArray(@NotNull VIAParser.JsonishArrayContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#jsonishCluster}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitJsonishCluster(@NotNull VIAParser.JsonishClusterContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#temaplate}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitTemaplate(@NotNull VIAParser.TemaplateContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#invoke}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitInvoke(@NotNull VIAParser.InvokeContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#element}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitElement(@NotNull VIAParser.ElementContext ctx);
	/**
	 * Visit a parse tree produced by {@link VIAParser#fieldName}.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	T visitFieldName(@NotNull VIAParser.FieldNameContext ctx);
}