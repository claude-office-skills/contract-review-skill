#!/usr/bin/env python3
"""Command-line interface for Contract Review Skill."""

import os
import sys
from pathlib import Path
from datetime import datetime

import click
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.analyze import (
    analyze_contract, 
    check_completeness, 
    compare_contracts,
    extract_key_terms,
    generate_report,
    get_available_jurisdictions,
    load_jurisdiction_knowledge
)

console = Console()


def check_api_key():
    """Check if API key is set."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        console.print(
            "[red]Error: ANTHROPIC_API_KEY not set.[/red]\n"
            "Please set it via:\n"
            "  export ANTHROPIC_API_KEY='your-api-key'\n"
            "Or create a .env file with:\n"
            "  ANTHROPIC_API_KEY=your-api-key"
        )
        sys.exit(1)


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """Contract Review Skill - AI-powered contract analysis."""
    pass


@cli.command()
@click.argument("pdf_path", type=click.Path(exists=True))
@click.option("--output", "-o", type=click.Path(), help="Output file path")
@click.option(
    "--format", "-f",
    type=click.Choice(["markdown", "json"]),
    default="markdown",
    help="Output format"
)
@click.option("--model", "-m", default="claude-sonnet-4-20250514", help="Claude model to use")
@click.option(
    "--jurisdiction", "-j",
    type=click.Choice(["us", "china", "eu", "uk", "auto"]),
    default="auto",
    help="Jurisdiction for legal analysis (auto-detect if not specified)"
)
@click.option(
    "--contract-type", "-t",
    type=click.Choice(["employment", "nda", "service", "procurement"]),
    default="employment",
    help="Type of contract for jurisdiction-specific rules"
)
def analyze(pdf_path, output, format, model, jurisdiction, contract_type):
    """Analyze a contract PDF and identify risks."""
    check_api_key()
    
    jurisdiction_display = jurisdiction if jurisdiction != "auto" else "auto-detect"
    console.print(Panel(
        f"[bold blue]Analyzing contract:[/bold blue] {pdf_path}\n"
        f"[dim]Jurisdiction: {jurisdiction_display} | Type: {contract_type}[/dim]"
    ))
    
    # Set jurisdiction to None for auto-detect
    actual_jurisdiction = None if jurisdiction == "auto" else jurisdiction
    
    with console.status("[bold green]Processing with Claude..."):
        try:
            result = analyze_contract(
                pdf_path, 
                model=model, 
                jurisdiction=actual_jurisdiction,
                contract_type=contract_type
            )
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
            sys.exit(1)
    
    if result["status"] == "success":
        analysis = result["analysis"]
        
        # Display usage info
        console.print(
            f"\n[dim]Tokens used: {result['usage']['input_tokens']} input, "
            f"{result['usage']['output_tokens']} output[/dim]"
        )
        
        if output:
            # Save to file
            Path(output).write_text(analysis, encoding="utf-8")
            console.print(f"\n[green]Analysis saved to:[/green] {output}")
        else:
            # Display in console
            console.print("\n")
            console.print(Markdown(analysis))
    else:
        console.print(f"[red]Analysis failed[/red]")
        sys.exit(1)


@cli.command()
@click.argument("pdf_path", type=click.Path(exists=True))
@click.option("--output", "-o", type=click.Path(), help="Output file path")
def check(pdf_path, output):
    """Check contract completeness (signatures, stamps, dates)."""
    check_api_key()
    
    console.print(Panel(f"[bold blue]Checking completeness:[/bold blue] {pdf_path}"))
    
    with console.status("[bold green]Checking with Claude Vision..."):
        try:
            result = check_completeness(pdf_path)
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
            sys.exit(1)
    
    if result["status"] == "success":
        check_result = result["result"]
        
        console.print(
            f"\n[dim]Tokens used: {result['usage']['input_tokens']} input, "
            f"{result['usage']['output_tokens']} output[/dim]"
        )
        
        if output:
            Path(output).write_text(check_result, encoding="utf-8")
            console.print(f"\n[green]Result saved to:[/green] {output}")
        else:
            console.print("\n")
            console.print(Markdown(check_result))
    else:
        console.print(f"[red]Check failed[/red]")
        sys.exit(1)


@cli.command()
@click.argument("pdf_a", type=click.Path(exists=True))
@click.argument("pdf_b", type=click.Path(exists=True))
@click.option("--output", "-o", type=click.Path(), help="Output file path")
def compare(pdf_a, pdf_b, output):
    """Compare two contracts and highlight differences."""
    check_api_key()
    
    console.print(Panel(
        f"[bold blue]Comparing contracts:[/bold blue]\n"
        f"  A: {pdf_a}\n"
        f"  B: {pdf_b}"
    ))
    
    with console.status("[bold green]Comparing with Claude..."):
        try:
            result = compare_contracts(pdf_a, pdf_b)
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
            sys.exit(1)
    
    if result["status"] == "success":
        comparison = result["comparison"]
        
        console.print(
            f"\n[dim]Tokens used: {result['usage']['input_tokens']} input, "
            f"{result['usage']['output_tokens']} output[/dim]"
        )
        
        if output:
            Path(output).write_text(comparison, encoding="utf-8")
            console.print(f"\n[green]Comparison saved to:[/green] {output}")
        else:
            console.print("\n")
            console.print(Markdown(comparison))
    else:
        console.print(f"[red]Comparison failed[/red]")
        sys.exit(1)


@cli.command()
@click.argument("pdf_path", type=click.Path(exists=True))
@click.option("--output", "-o", type=click.Path(), help="Output file path (JSON)")
def extract(pdf_path, output):
    """Extract key terms from a contract in structured JSON format."""
    check_api_key()
    
    console.print(Panel(f"[bold blue]Extracting key terms:[/bold blue] {pdf_path}"))
    
    with console.status("[bold green]Extracting with Claude..."):
        try:
            result = extract_key_terms(pdf_path)
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
            sys.exit(1)
    
    if result["status"] == "success":
        key_terms = result["key_terms"]
        
        console.print(
            f"\n[dim]Tokens used: {result['usage']['input_tokens']} input, "
            f"{result['usage']['output_tokens']} output[/dim]"
        )
        
        if output:
            import json
            Path(output).write_text(
                json.dumps(key_terms, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            console.print(f"\n[green]Key terms saved to:[/green] {output}")
        else:
            import json
            console.print("\n")
            console.print(json.dumps(key_terms, ensure_ascii=False, indent=2))
    else:
        console.print(f"[red]Extraction failed[/red]")
        sys.exit(1)


@cli.command()
@click.argument("input_file", type=click.Path(exists=True))
@click.argument("output_file", type=click.Path())
@click.option(
    "--format", "-f",
    type=click.Choice(["markdown", "docx"]),
    default="markdown",
    help="Output format"
)
@click.option("--title", "-t", default="Contract Analysis Report", help="Report title")
def export(input_file, output_file, format, title):
    """Export analysis results to Markdown or DOCX format."""
    
    console.print(Panel(f"[bold blue]Exporting report:[/bold blue] {input_file} → {output_file}"))
    
    # Read input file
    try:
        analysis_text = Path(input_file).read_text(encoding="utf-8")
    except Exception as e:
        console.print(f"[red]Error reading input file: {e}[/red]")
        sys.exit(1)
    
    # Generate report
    result = generate_report(
        analysis=analysis_text,
        output_path=output_file,
        format=format,
        title=title
    )
    
    if result["status"] == "success":
        console.print(f"\n[green]Report exported to:[/green] {result['output_path']}")
        console.print(f"[dim]Format: {result['format']}[/dim]")
    else:
        console.print(f"[red]Export failed: {result.get('message', 'Unknown error')}[/red]")
        sys.exit(1)


@cli.command()
@click.option("--jurisdiction", "-j", help="Show details for specific jurisdiction")
def jurisdictions(jurisdiction):
    """List available jurisdiction knowledge bases."""
    available = get_available_jurisdictions()
    
    if not available:
        console.print("[yellow]No jurisdiction knowledge bases found.[/yellow]")
        return
    
    if jurisdiction:
        # Show details for specific jurisdiction
        knowledge = load_jurisdiction_knowledge(jurisdiction, "employment")
        if not knowledge:
            console.print(f"[red]No knowledge base found for: {jurisdiction}[/red]")
            return
        
        console.print(Panel(f"[bold]Jurisdiction: {jurisdiction.upper()}[/bold]"))
        
        # Show primary laws
        if "jurisdiction" in knowledge and "primary_laws" in knowledge["jurisdiction"]:
            console.print("\n[bold]Primary Laws:[/bold]")
            for law in knowledge["jurisdiction"]["primary_laws"]:
                console.print(f"  • {law['name']} ({law['citation']})")
        
        # Show risk patterns count
        if "risk_patterns" in knowledge:
            console.print(f"\n[bold]Risk Patterns:[/bold] {len(knowledge['risk_patterns'])} jurisdiction-specific patterns")
        
        # Show state notes if US
        if "state_specific_notes" in knowledge:
            console.print(f"\n[bold]State-Specific Notes:[/bold] {len(knowledge['state_specific_notes'])} states covered")
    else:
        # List all available
        console.print(Panel.fit(
            "[bold]Available Jurisdiction Knowledge Bases[/bold]\n\n" +
            "\n".join([f"  • {j.upper()}" for j in available]) +
            "\n\n[dim]Use --jurisdiction <code> for details[/dim]",
            title="Jurisdictions"
        ))


@cli.command()
def info():
    """Show skill information and configuration."""
    available_jurisdictions = get_available_jurisdictions()
    
    console.print(Panel.fit(
        "[bold]Contract Review Skill[/bold]\n\n"
        f"Version: 0.1.0\n"
        f"API Key: {'[green]Set[/green]' if os.getenv('ANTHROPIC_API_KEY') else '[red]Not set[/red]'}\n"
        f"Model: claude-sonnet-4-20250514\n"
        f"Jurisdictions: {', '.join(j.upper() for j in available_jurisdictions) if available_jurisdictions else 'None'}\n\n"
        "[bold]Available Commands:[/bold]\n"
        "  analyze       - Full contract analysis\n"
        "  extract       - Extract key terms (JSON)\n"
        "  check         - Completeness check\n"
        "  compare       - Compare two contracts\n"
        "  export        - Export to MD/DOCX\n"
        "  jurisdictions - List legal knowledge bases\n\n"
        "[dim]https://github.com/lijie420461340/contract-review-skill[/dim]",
        title="Info"
    ))


if __name__ == "__main__":
    cli()
