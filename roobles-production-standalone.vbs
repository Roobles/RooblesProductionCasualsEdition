' ------------------ Variables
Dim ratz, ratzSet, ratzChance
Dim matchRegex, tournRegex, coreRegexVal, quoteRegex
Dim winWidth, winHeight, inputForm, outputForm, scriptDir, mediaDir, statsDir
Dim logoScript, statScript, stdOutFile, ratzFile, statsFile, configFile
Dim logoSaveScriptName, statGetScriptName, stdOutFileName, ratzFileName
Dim faceitIdType
Const faceit_type_unknown = 0, faceit_type_match = 1, faceit_type_tourn = 2
Const ForReading = 1, ForWriting = 2, ForAppending = 8

winWidth = 1550
winHeight = 1000

logoSaveScriptName = "save-team-logo.sh"
statGetScriptName = "get-match-stats.sh"
stdOutFileName = "stdout.txt"
ratzFileName = "web.ratz"

coreRegexVal = "[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}"

set matchRegex = New RegExp
With matchRegex 
  .Pattern = "^1-" + coreRegexVal + "$"
  .IgnoreCase = True
End With

set tournRegex = New RegExp
With tournRegex 
  .Pattern = "^" + coreRegexVal + "$"
  .IgnoreCase = True
End With

set quoteRegex = new RegExp
With quoteRegex
  .Pattern = "(""[^""]+"")"
  .Global = true
End With

set argRegex = new RegExp
With argRegex
  .Pattern = "(--?[a-zi0-9]+) "
  .IgnoreCase = true
  .Global = true
End With

faceitIdType = faceit_type_unknown

scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(document.location.pathname)
mediaDir = scriptDir + "\media"
statsDir = scriptDir + "\stats"
logoScript = scriptDir + "\" + logoSaveScriptName
statScript = scriptDir + "\" + statGetScriptName
stdOutFile = scriptDir + "\" + stdOutFileName
ratzFile = mediaDir + "\" + ratzFileName
statsFile = statsDir + "\stats.js"
configFile = scriptDir + "\config.vbs"
ratz = Array(0)
ratzSet = false
ratzChance = 3


' ------------------ Main
Sub Window_OnLoad
  window.resizeto winWidth,winHeight

  set inputForm = document.forms.InputForm
  set outputForm = document.forms.OutputForm

  inputForm.logoDir.value = defaultLogoSaveFolder

  ClearOutput
  EnableInput
End Sub


' ------------------ UI
Sub EnableInput
  document.body.style.cursor = "auto"

  EnableInputElement inputForm.faceitId
  EnableInputElement inputForm.logoDir
  EnableInputElement inputForm.browseDir
  EnableInputElement inputForm.saveLogoButton
  EnableInputElement inputForm.getStatsButton
  EnableInputElement outputForm.clearOutputBtn

  EnableSubmit
End Sub

Sub EnableSubmit
  inputForm.saveLogoButton.disabled = Not ValidateDownloadLogos
  inputForm.getStatsButton.disabled = Not ValidateGetMatchStats
End Sub

Sub DisableInput
  document.body.style.cursor = "progress"

  DisableInputElement inputForm.faceitId
  DisableInputElement inputForm.logoDir
  DisableInputElement inputForm.browseDir
  DisableInputElement inputForm.saveLogoButton
  DisableInputElement inputForm.getStatsButton
  DisableInputElement outputForm.clearOutputBtn
End Sub

Function ValidateDownloadLogos
  Dim faceitId, fieldLabel, baseLabel
  Dim labelSuffix, isValid

  faceitId = inputForm.faceitId.value
  set fieldLabel = document.getElementById("faceitIdLabel")
  baseLabel = "FaceIT Id"

  If matchRegex.Test(faceitId) Then
    isValid = true 
    labelSuffix = " (Match):"
    faceitIdType = faceit_type_match

  ElseIf tournRegex.Test(faceitId) Then
    isValid = true
    labelSuffix = " (Tournament):"
    faceitIdType = faceit_type_tourn

  Else
    isValid = false
    labelSuffix = ":"
    faceitIdType = faceit_type_unknown 
  End If

  fieldLabel.innerHtml = baseLabel + labelSuffix
  ValidateDownloadLogos = isValid
End Function

Function ValidateGetMatchStats
  Dim faceitId
  faceitId = inputForm.faceitId.value

  ValidateGetMatchStats = matchRegex.Test(faceitId)
End Function


' ------------------ Utility
Function IsUnset(checkVal)
  IsUnset = IsEmpty(checkVal) or IsNull(checkVal) or checkVal = "" 
End Function

Sub AlertError(errorMessage)
  MsgBox errorMessage, vbCritital, "Error"
End Sub

Function PickFolder(rootFolder, promptDescription)
    Dim shell, oFldr, options
    Set shell = CreateObject("Shell.Application")

    options = &H0001 + &H0004 + &H0010 + &H0020 + &H0040 + &H0100
    Set oFldr = shell.BrowseForFolder(0, promptDescription, options, rootFolder)
    If (Not oFldr Is Nothing) Then
        PickFolder = oFldr.Self.Path
    Else
        PickFolder = ""
    End If
    Set shell = Nothing
    Set oFldr = Nothing
End Function

Function AssertBash()
  If IsUnset(gitBashExecutable) Then
    AlertError "Missing configuration for gitbash executable." + vbCrLf + "Please update the configuration and restart this app."
    AssertBash = false
    Exit Function
  End If

  AssertBash = true
End Function

Sub RunShellScript(scriptCmd)
  Dim Shell, rtrnCode, ctlCmd
  Dim intervalHandle

  If not AssertBash() Then
    Exit Sub
  End If

  ctlCmd = """" + gitBashExecutable + """ --login -c '" + scriptCmd + "'"

  AppendLineToOutput "<br />" + InsertSyntaxHighlighting(ctlCmd) + "<br />"

  DisableInput
  Set Shell=CreateObject("wscript.shell")
    intervalHandle = window.setInterval("UpdateOutput", 1000)
    Shell.run ctlCmd, 0, True
    window.clearInterval intervalHandle 
  Set Shell=Nothing

  InjectRat
  EnableInput
End Sub

Sub EnableInputElement(element)
  element.disabled = false
  element.style.cursor = "auto"
End Sub

Sub DisableInputElement(element)
  element.disabled = true
  element.style.cursor = "progress"
End Sub

Function InsertSyntaxHighlighting(outputTxt)
  
  InsertSyntaxHighlighting = argRegex.Replace(quoteRegex.Replace(outputTxt, "<span class=""blue"">$1</span>"), "<span class=""lightyellow"">$1</span> ")
End Function

' ------------------ Config
Sub SaveConfig(logoDir, gitbashExe)

  Dim fso, fileHandle
  Set fso = CreateObject("Scripting.FileSystemObject")
  Set fileHandle = fso.OpenTextFile(configFile, ForWriting, True)

    fileHandle.WriteLine BuildConfigLine("defaultLogoSaveFolder", logoDir)
    fileHandle.WriteLine BuildConfigLine("gitBashExecutable ", gitbashExe)

  fileHandle.Close
  Set fileHandle = Nothing
  Set fso = Nothing
End Sub

Function GetConfigValue(configVarName, submittedValue)
  Dim currentValue
  Execute("currentValue = " + configVarName)

  If IsUnset(submittedValue) Then
    GetConfigValue = currentValue
  Else
    GetConfigValue = submittedValue
  End If
End Function

Function BuildConfigLine(configVarName, submittedValue)
  Dim configVal

  configVal = GetConfigValue(configVarName, submittedValue)
  If VarType(configVal) = vbString Then
    configVal = """" + configVal + """"
  End If

  BuildConfigLine = configVarName + "=" + configVal
End Function


' ------------------ Output 
Sub AppendLineToOutput(outputData)

  Dim fso, fileHandle
  Set fso = CreateObject("Scripting.FileSystemObject")
  Set fileHandle = fso.OpenTextFile(stdOutFile, ForAppending, True)

  fileHandle.WriteLine outputData + "<br/>"

  fileHandle.Close
  Set fileHandle = Nothing
  Set fso = Nothing

  UpdateOutput
End Sub

Sub UpdateOutput
  Dim fso, file

  Set fso = CreateObject("Scripting.FileSystemObject")
  Set file = fso.OpenTextFile(stdOutFile, 1)

  document.getElementById("stdout").innerHtml = file.ReadAll

  file.Close
  Set file = Nothing
  Set fso = Nothing
End Sub

Sub ClearOutput
  Dim fso

  Set fso = CreateObject("Scripting.FileSystemObject")

  If fso.FileExists(stdOutFile) Then
    fso.DeleteFile(stdOutFile)
  End If

  document.getElementById("stdout").innerHtml = ""
  Set fso = Nothing
End Sub


' ------------------ Logos
Sub SaveLogos 
  Dim scriptCmd
  Dim faceitId, logoDir, faceitType

  faceitId = inputForm.faceitId.value
  logoDir = inputForm.logoDir.value

  If faceitId = "" Then
    AlertError "Must Provide a FaceIt ID."
    Exit Sub
  End If

  Select case faceitIdType
    case faceit_type_match
      faceitType = "match"

    case faceit_type_tourn
      faceitType = "tournament"

    case else
      AlertError "Could not determine FaceIT Id Type."
      Exit Sub
  End Select

  scriptCmd = """" + logoScript + """ -I """ + faceitId + """ -l """ + logoDir + """ -wo """ + stdOutFile + """ -T " + faceitType 
  RunShellScript scriptCmd
End Sub

Sub BrowseForLogoDir
  Dim browseResult
  browseResult = PickFolder(Nothing, "Set a location for saving team logos:")

  If browseResult <> "" Then
    inputForm.logoDir.value = browseResult
    SaveConfig browseResult, Null
  End If
End Sub


' ------------------ Stats
Sub GetStats
  Dim scriptCmd, faceitId

  faceitId = inputForm.faceitId.value

  If faceitId = "" Then
    AlertError "Must Provide a FaceIt ID."
    Exit Sub
  End If

  scriptCmd = """" + statScript + """ -I """ + faceitID + """ -wo """ + stdOutFile + """ -W """ + statsFile + """"
  RunShellScript scriptCmd
End Sub


' ------------------ Rats
Function GetRatArray
  If ratzSet Then
    GetRatArray = ratz
    Exit Function
  End If

  Dim fso, file
  Set fso = CreateObject("Scripting.FileSystemObject")
  Set file = fso.OpenTextFile(ratzFile, ForReading)

  Do While file.AtEndOfStream <> True
    Redim Preserve ratz(UBound(ratz) + 1)
    ratz(UBound(ratz)) = file.ReadLine
  Loop

  file.Close
  Set file = Nothing
  Set fso = Nothing

  GetRatArray = ratz
End Function

Sub InjectRat

  Dim ratties, ratCount

  ratties = GetRatArray()
  ratCount = UBound(ratties)
  randomize
  AppendLineToOutput "<br/>" + ratties(int(rnd*ratCount)+1)
End Sub

Sub TryInjectRat(rChance)

  randomize
  If (int(rnd * rChance)) > 0 Then
    Exit Sub
  End If

  InjectRat
End Sub
