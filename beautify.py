import os
import re
import shutil
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Tuple
import time
import sys

# 安装必要的依赖
# pip install pylint mypy flake8 pyflakes bandit safety radon lizard black isort autopep8 yapf
# pip install pycodestyle pydocstyle pyyaml sqlparse jsbeautifier cssbeautifier

import pylint.lint
import mypy.api
import flake8.api.legacy as flake8
import pyflakes.api
import bandit.cli.main as bandit_main
from safety import safety
import radon.complexity as radon_cc
import lizard
import black
import isort
import autopep8
import yapf
import pycodestyle
import pydocstyle
import yaml
import sqlparse
import jsbeautifier
import cssbeautifier

# 全局锁用于同步输出
print_lock = threading.Lock()

def safe_print(message):
    with print_lock:
        print(message, flush=True)

def remove_comments(content: str, file_ext: str) -> str:
    # (保持原有的注释删除逻辑)
    pass

def format_code(content: str, file_path: str, file_ext: str) -> str:
    safe_print(f"正在格式化文件: {file_path}")
    if file_ext in ['.py', '.pyw']:
        try:
            content = black.format_file_contents(content, fast=False, mode=black.FileMode())
            content = isort.code(content)
        except Exception as e:
            safe_print(f"格式化 {file_path} 时出错: {str(e)}")
    elif file_ext in ['.js', '.jsx', '.ts', '.tsx']:
        try:
            content = jsbeautifier.beautify(content)
        except Exception as e:
            safe_print(f"格式化 {file_path} 时出错: {str(e)}")
    elif file_ext == '.css':
        try:
            content = cssbeautifier.beautify(content)
        except Exception as e:
            safe_print(f"格式化 {file_path} 时出错: {str(e)}")
    elif file_ext == '.sql':
        try:
            content = sqlparse.format(content, reindent=True, keyword_case='upper')
        except Exception as e:
            safe_print(f"格式化 {file_path} 时出错: {str(e)}")
    elif file_ext in ['.yaml', '.yml']:
        try:
            content = yaml.dump(yaml.safe_load(content), default_flow_style=False)
        except Exception as e:
            safe_print(f"格式化 {file_path} 时出错: {str(e)}")
    safe_print(f"完成格式化: {file_path}")
    return content

def lint_code(file_path: str, file_ext: str) -> List[Tuple[str, str]]:
    safe_print(f"正在检查文件: {file_path}")
    lint_results = []
    if file_ext in ['.py', '.pyw']:
        # Python
        pylint_reporter = pylint.lint.TextReporter()
        pylint.lint.Run([file_path], reporter=pylint_reporter, exit=False)
        lint_results.append(("Pylint", pylint_reporter.out.getvalue()))

        mypy_result = mypy.api.run([file_path])
        lint_results.append(("Mypy", mypy_result[0]))

        flake8_style = flake8.get_style_guide()
        flake8_result = flake8_style.check_files([file_path])
        lint_results.append(("Flake8", str(flake8_result.get_statistics())))

        pyflakes_result = pyflakes.api.check(file_path)
        lint_results.append(("Pyflakes", str(pyflakes_result)))

        radon_result = radon_cc.cc_visit(file_path)
        lint_results.append(("Radon", str(radon_result)))

        lizard_result = lizard.analyze_file(file_path)
        lint_results.append(("Lizard", str(lizard_result)))

        pycodestyle_result = pycodestyle.StyleGuide().check_files([file_path])
        lint_results.append(("Pycodestyle", str(pycodestyle_result.get_statistics())))

        pydocstyle_result = list(pydocstyle.check([file_path]))
        lint_results.append(("Pydocstyle", str(pydocstyle_result)))

    elif file_ext in ['.js', '.jsx', '.ts', '.tsx']:
        # JavaScript/TypeScript
        # 这里我们移除了 Pyright，因为它可能与 Python 3.11 不兼容
        pass

    safe_print(f"完成检查: {file_path}")
    return lint_results

def security_check(file_path: str, file_ext: str) -> List[Tuple[str, str]]:
    safe_print(f"正在进行安全检查: {file_path}")
    security_results = []
    if file_ext in ['.py', '.pyw']:
        bandit_result = bandit_main.main(['-f', 'custom', '-n', '3', file_path])
        security_results.append(("Bandit", str(bandit_result)))

        safety_result = safety.check(key="", db_mirror="", cached=False, ignore_ids=(), proxy={})
        security_results.append(("Safety", str(safety_result)))
    safe_print(f"完成安全检查: {file_path}")
    return security_results

def process_file(file_path: str) -> dict:
    file_ext = os.path.splitext(file_path)[1].lower()
    safe_print(f"开始处理文件: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        safe_print(f"已读取文件: {file_path}")
        
        if file_ext != '.json':
            content = remove_comments(content, file_ext)
        
        formatted_content = format_code(content, file_path, file_ext)
        
        lint_results = lint_code(file_path, file_ext)
        security_results = security_check(file_path, file_ext)
        
        # 创建备份
        backup_path = file_path + '.bak'
        shutil.copy2(file_path, backup_path)
        safe_print(f"已创建备份: {backup_path}")
        
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(formatted_content)
        safe_print(f"已写入格式化后的内容: {file_path}")
        
        return {
            'file_path': file_path,
            'lint_results': lint_results,
            'security_results': security_results
        }
    except Exception as e:
        safe_print(f"处理文件 {file_path} 时出错: {str(e)}")
        return {
            'file_path': file_path,
            'error': str(e)
        }

def process_directory(directory: str) -> List[dict]:
    supported_extensions = [
        '.py', '.pyw', '.js', '.jsx', '.ts', '.tsx',
        '.html', '.xml', '.svg', '.css', '.json', '.yaml', '.yml', '.sql'
    ]
    results = []
    
    with ThreadPoolExecutor(max_workers=os.cpu_count()) as executor:
        future_to_file = {}
        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                file_ext = os.path.splitext(file)[1].lower()
                if file_ext in supported_extensions:
                    future = executor.submit(process_file, file_path)
                    future_to_file[future] = file_path
        
        for future in as_completed(future_to_file):
            file_path = future_to_file[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as exc:
                safe_print(f'{file_path} 生成了一个异常: {exc}')
    
    return results

if __name__ == "__main__":
    start_time = time.time()
    current_directory = os.getcwd()
    results = process_directory(current_directory)
    
    for result in results:
        if 'error' in result:
            safe_print(f"\n处理文件时出错: {result['file_path']}")
            safe_print(f"错误信息: {result['error']}")
        else:
            safe_print(f"\n处理文件: {result['file_path']}")
            safe_print("语法检查结果:")
            for linter, output in result['lint_results']:
                safe_print(f"  {linter}:\n{output}")
            safe_print("安全检查结果:")
            for checker, output in result['security_results']:
                safe_print(f"  {checker}:\n{output}")
    
    end_time = time.time()
    safe_print(f"\n处理完成。总耗时: {end_time - start_time:.2f} 秒")
