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

from src.analyze import analyze_contract, check_completeness, compare_contracts

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
def analyze(pdf_path, output, format, model):
    """Analyze a contract PDF and identify risks."""
    check_api_key()
    
    console.print(Panel(f"[bold blue]Analyzing contract:[/bold blue] {pdf_path}"))
    
    with console.status("[bold green]Processing with Claude..."):
        try:
            result = analyze_contract(pdf_path, model=model)
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
def info():
    """Show skill information and configuration."""
    console.print(Panel.fit(
        "[bold]Contract Review Skill[/bold]\n\n"
        f"Version: 0.1.0\n"
        f"API Key: {'[green]Set[/green]' if os.getenv('ANTHROPIC_API_KEY') else '[red]Not set[/red]'}\n"
        f"Model: claude-sonnet-4-20250514\n\n"
        "[dim]https://github.com/lijie420461340/contract-review-skill[/dim]",
        title="Info"
    ))


if __name__ == "__main__":
    cli()
